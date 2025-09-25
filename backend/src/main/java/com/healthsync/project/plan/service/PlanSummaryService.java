package com.healthsync.project.plan.service;

import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalMetrics;
import com.healthsync.project.plan.dto.PlanSummaryDto;
import com.healthsync.project.plan.repository.GoalMetricsRepository;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanSummaryService {

    private final GoalRepository goalRepo;
    private final GoalMetricsRepository metricsRepo;
    private final ProfileRepository profileRepo;
    private final PlanCalcService calc;

    /**
     * 컨트롤러에서 주는 tdee/sex/mealsPerDay(선택)를 우선 반영.
     * 저장된 metrics가 있으면 그 값 사용, 없으면 즉석 계산(비저장).
     */
    @Transactional(readOnly = true)
    public PlanSummaryDto summary(Long userId, Long goalId,
                                  Integer tdeeParam, String sexParam, Integer mealsParam) {

// after (로그인 없어도 동작, 로그인된 경우엔 주인 확인 가능)
        Goal goal = goalRepo.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("goal not found"));
        if (userId != null && !goal.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Forbidden: not your goal");
        }

        // --- 1) metrics 우선 사용 -------------------------------------------------
        GoalMetrics m = metricsRepo.findByGoalId(goalId).orElse(null);
        if (m != null) {
            // 요청 파라미터가 들어온 경우에는 화면 미세조정을 위해 끼니수만 덮어쓸 수 있게 처리
            int meals = (mealsParam != null) ? mealsParam :
                    (m.getMealsPerDay() != null ? m.getMealsPerDay() : defaultMeals(goal));

            Integer targetDaily = m.getTargetDailyKcal();
            Integer perMeal = (targetDaily != null) ? calc.perMeal(targetDaily, meals) : null;

            Map<String,Integer> ratio = Map.of(
                    "carb", nz(m.getRatioCarb()),
                    "protein", nz(m.getRatioProt()),
                    "fat", nz(m.getRatioFat())
            );

            PlanSummaryDto.MacroGrams dailyG = (targetDaily != null)
                    ? toGrams(calc.macroGPerDay(targetDaily, ratio))
                    : new PlanSummaryDto.MacroGrams(0,0,0);

            PlanSummaryDto.MacroGrams perMealG = (targetDaily != null)
                    ? toGrams(calc.macroGPerMeal(calc.macroGPerDay(targetDaily, ratio), meals))
                    : new PlanSummaryDto.MacroGrams(0,0,0);

            List<String> missing = new ArrayList<>();
            boolean profileReady = true; // metrics가 있으면 최소 핵심값은 준비되었다고 봄

            return new PlanSummaryDto(
                    profileReady,
                    missing,
                    m.getTdeeBaseline(),       // tdee
                    targetDaily,               // dailyKcal (권장 섭취)
                    meals,                     // mealsPerDay
                    perMeal,                   // perMealKcal
                    new PlanSummaryDto.MacroRatio(ratio.get("carb"), ratio.get("protein"), ratio.get("fat")),
                    dailyG,
                    perMealG,
                    buildForecast(goal)        // 간단 선형 예측
            );
        }

        // --- 2) metrics 없으면 즉석 계산 ------------------------------------------
        Profile prof = profileRepo.findByUserId(goal.getUserId()).orElse(null);

        // sex: param > goal > profile
        String sex = (sexParam != null && !sexParam.isBlank()) ? sexParam : goal.getSex();
        if (sex == null && prof != null && prof.getGender() != null) sex = mapGender(prof.getGender());

        // meals
        int meals = (mealsParam != null) ? mealsParam :
                (goal.getMealsPerDay() != null ? goal.getMealsPerDay() : defaultMeals(goal));

        // tdee: param > profile 계산 > null
        Integer tdee = tdeeParam;
        if (tdee == null && prof != null) {
            Integer age = (prof.getAge() > 0) ? prof.getAge() : null;
            Integer heightCm = (prof.getHeight() != null) ? Math.round(prof.getHeight().floatValue()) : null;
            Integer weightKg = (prof.getWeight() != null) ? Math.round(prof.getWeight().floatValue()) : null;
            Integer activity = (prof.getActivityLevel() >= 1 && prof.getActivityLevel() <= 4)
                    ? prof.getActivityLevel() : null;
            if (sex != null && age != null && heightCm != null && weightKg != null && activity != null) {
                tdee = calc.calcTdee(sex, age, heightCm, weightKg, activity);
            }
        }

        int weeks = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        double sKg = dv(goal.getStartWeightKg());
        double tKg = dv(goal.getTargetWeightKg());
        int raw = calc.calcDailyDelta(sKg, tKg, weeks);
        int applied = calc.clampByPlanLimit(goal.getType(), raw, tdee);

        Integer targetDaily = (tdee != null) ? (tdee + applied) : null;  // 권장 섭취
        if (targetDaily != null) targetDaily = calc.applyFloor(targetDaily, sex);

        Integer perMeal = calc.perMeal(targetDaily, meals);

        Map<String,Integer> ratio = calc.ratioFor(goal.getType());
        PlanSummaryDto.MacroGrams dailyG = (targetDaily != null)
                ? toGrams(calc.macroGPerDay(targetDaily, ratio))
                : new PlanSummaryDto.MacroGrams(0,0,0);

        PlanSummaryDto.MacroGrams perMealG = (targetDaily != null)
                ? toGrams(calc.macroGPerMeal(calc.macroGPerDay(targetDaily, ratio), meals))
                : new PlanSummaryDto.MacroGrams(0,0,0);

        // profile readiness & missing fields
        List<String> missing = new ArrayList<>();
        boolean profileReady = true;
        if (prof == null) {
            profileReady = false;
            missing.add("profile"); // 프로필 자체가 없음
        } else {
            if (prof.getAge() <= 0) { profileReady = false; missing.add("age"); }
            if (prof.getHeight() == null) { profileReady = false; missing.add("height"); }
            if (prof.getWeight() == null) { profileReady = false; missing.add("weight"); }
            if (prof.getActivityLevel() < 1 || prof.getActivityLevel() > 4) { profileReady = false; missing.add("activityLevel"); }
        }

        return new PlanSummaryDto(
                profileReady,
                missing,
                tdee,                        // tdee
                targetDaily,                 // dailyKcal (권장 섭취)
                meals,                       // mealsPerDay
                perMeal,                     // perMealKcal
                new PlanSummaryDto.MacroRatio(ratio.get("carb"), ratio.get("protein"), ratio.get("fat")),
                dailyG,
                perMealG,
                buildForecast(goal)
        );
    }

    // ---------- helpers ----------

    private int defaultMeals(Goal goal) {
        return (goal.getMealsPerDay() != null && goal.getMealsPerDay() > 0) ? goal.getMealsPerDay() : 3;
    }

    private int nz(Integer v) { return v == null ? 0 : v; }

    private double dv(BigDecimal v) { return v == null ? 0d : v.doubleValue(); }

    private PlanSummaryDto.MacroGrams toGrams(Map<String,Integer> m) {
        return new PlanSummaryDto.MacroGrams(
                m.getOrDefault("carb", 0),
                m.getOrDefault("protein", 0),
                m.getOrDefault("fat", 0)
        );
    }

    /** Goal의 기간을 선형으로 가정한 간단 예측치(주차별 예상체중). 필요시 개선 가능 */
    private List<PlanSummaryDto.ForecastPoint> buildForecast(Goal goal) {
        int weeks = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        BigDecimal s = goal.getStartWeightKg();
        BigDecimal t = goal.getTargetWeightKg();
        List<PlanSummaryDto.ForecastPoint> list = new ArrayList<>();
        if (weeks <= 0 || s == null || t == null) return list;

        double start = s.doubleValue();
        double target = t.doubleValue();
        double step = (target - start) / weeks;
        double cur = start;
        for (int w = 1; w <= weeks; w++) {
            cur += step;
            list.add(new PlanSummaryDto.ForecastPoint(w, round1(cur))); // 소수1자리
        }
        return list;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private String mapGender(GenderType g) {
        if (g == null) return null;
        return switch (g) {
            case MALE -> "M";
            case FEMALE -> "F";
            default -> null;
        };
    }
}
