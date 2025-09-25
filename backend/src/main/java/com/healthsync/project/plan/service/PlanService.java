package com.healthsync.project.plan.service;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalMetrics;
import com.healthsync.project.plan.domain.GoalType;
import com.healthsync.project.plan.domain.PlanDuration;
import com.healthsync.project.plan.dto.SavePlanRequest;
import com.healthsync.project.plan.repository.GoalMetricsRepository;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.repository.ProfileRepository;


import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanService {

    private final GoalRepository repo;
    private final GoalMetricsRepository metricsRepo;
    private final PlanCalcService calc;
    private final ProfileRepository profileRepository;

    /**
     * 목표 저장 + 즉시 스냅샷(upsert)까지 수행
     * @param userId 로그인 사용자
     * @param req SavePlanRequest (type, startDate, weeks, start/target kg, mealsPerDay 등)
     * @param tdeeNullable  프로필 기반 TDEE (nullable)
     * @param sexNullable   "M"|"F"|null
     * @return goalId
     */
    @Transactional
    public Long save(Long userId, SavePlanRequest req, Integer tdeeNullable, String sexNullable) {
        Goal g = new Goal(
                userId,
                GoalType.from(req.getType()),
                LocalDate.parse(req.getStartDate()),
                PlanDuration.of(req.getWeeks()),
                BigDecimal.valueOf(req.getStartWeightKg()),
                BigDecimal.valueOf(req.getTargetWeightKg())
        );

        int delta = calc.calcDailyDelta(req.getStartWeightKg(), req.getTargetWeightKg(), req.getWeeks());
        g.changeMealsPerDay(req.getMealsPerDay()); // null -> 내부에서 3 처리
        g.changeCalorieDeltaPerDay(delta);

        repo.save(g);

        // 저장 직후, 스냅샷도 준비(없으면 insert, 있으면 update)
        upsertMetrics(g, tdeeNullable, sexNullable, req.getMealsPerDay());

        return g.getId();
    }

    // 기존 시그니처도 유지(호환): tdee/sex는 모를 수 있음
    @Transactional
    public Long save(Long userId, SavePlanRequest req) {
        return save(userId, req, null, null);
    }

    @Transactional(readOnly = true)
    public Goal get(Long goalId, Long userId) {
        return repo.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("goal not found"));
    }

    /** 목표 스냅샷 upsert (저장 또는 갱신) */
    @Transactional
    public GoalMetrics upsertMetrics(Goal goal, Integer tdee, String sex, Integer mealsOverride) {
        log.info("[PlanService] upsertMetrics START goalId={}, tdee={}, sex={}, meals={}",
                goal.getId(), tdee, sex, mealsOverride);

        // 0) 기본값/보정 준비
        int weeks = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        double startKg = (goal.getStartWeightKg() != null) ? goal.getStartWeightKg().doubleValue() : 0d;
        double targetKg = (goal.getTargetWeightKg() != null) ? goal.getTargetWeightKg().doubleValue() : 0d;
        int meals = (mealsOverride != null)
                ? mealsOverride
                : (goal.getMealsPerDay() != null ? goal.getMealsPerDay() : 3);

        // 1) sex 보충: Goal → Profile 순서
        if (sex == null) sex = goal.getSex(); // Goal엔 String("M"/"F")일 가능성
        Profile prof = null;
        if (sex == null || tdee == null) {
            prof = profileRepository.findByUserId(goal.getUserId()).orElse(null);
        }
        if (sex == null && prof != null && prof.getGender() != null) {
            sex = mapGender(prof.getGender()); // GenderType -> "M"/"F"/null
        }

        // 2) TDEE 보충: 인자가 null이면 Profile 값으로 계산 시도
        if (tdee == null && prof != null) {
            try {
                // Profile 필드: age(int), height(BigDecimal, cm), weight(BigDecimal, kg), activityLevel(int)
                Integer age = (prof.getAge() > 0) ? prof.getAge() : null;
                Integer heightCm = (prof.getHeight() != null) ? prof.getHeight().intValue() : null;
                Integer weightKg = (prof.getWeight() != null) ? prof.getWeight().intValue() : null;
                Integer activity = (prof.getActivityLevel() >= 1 && prof.getActivityLevel() <= 4)
                        ? prof.getActivityLevel() : null;

                if (age != null && heightCm != null && weightKg != null && activity != null && sex != null) {
                    // ⚠️ calc.calcTdee 시그니처는 네 프로젝트에 맞게 이미 존재한다고 가정
                    tdee = calc.calcTdee(sex, age, heightCm, weightKg, activity);
                }
            } catch (Exception ignore) {
                // 프로필 값이 모자라거나 계산 실패 시, tdee는 그대로 null 유지
            }
        }

        // 3) 원시/적용 델타 계산
        int raw = calc.calcDailyDelta(startKg, targetKg, weeks);
        int applied = calc.clampByPlanLimit(goal.getType(), raw, tdee);

        // 4) 타깃 칼로리/끼니당 계산 (tdee가 있어야 산출됨)
        Integer targetDaily = (tdee != null) ? (tdee + applied) : null;
        if (targetDaily != null) {
            targetDaily = calc.applyFloor(targetDaily, sex); // 성별별 최소치 바닥 적용
        }
        Integer perMeal = calc.perMeal(targetDaily, meals);

        // 5) 탄단지 비율
        var ratio = calc.ratioFor(goal.getType()); // {"carb":40,"protein":35,"fat":25} 등

        // 6) upsert
        GoalMetrics m = metricsRepo.findByGoalId(goal.getId()).orElse(new GoalMetrics(goal));
        m.setTdeeBaseline(tdee);
        m.setSex(sex);
        m.setDailyDeltaRaw(raw);
        m.setDailyDeltaApplied(applied);
        m.setTargetDailyKcal(targetDaily);
        m.setPerMealKcal(perMeal);
        m.setRatioCarb(ratio.get("carb"));
        m.setRatioProt(ratio.get("protein"));
        m.setRatioFat(ratio.get("fat"));
        m.setMealsPerDay(meals);

        GoalMetrics saved = metricsRepo.save(m);
        log.info("[PlanService] upsertMetrics DONE metricsId={}, goalId={}, tdee={}, sex={}, targetDaily={}, perMeal={}",
                saved.getId(), goal.getId(), tdee, sex, targetDaily, perMeal);
        return saved;
    }

    /** GenderType -> "M"/"F"/null 로 변환 */
    private String mapGender(GenderType g) {
        if (g == null) return null;
        return switch (g) {
            case MALE -> "M";
            case FEMALE -> "F";
            default -> null; // NOTTHING 등 기타 값은 null
        };
    }
}
