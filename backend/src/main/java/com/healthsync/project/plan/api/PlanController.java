package com.healthsync.project.plan.api;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalMetrics;
import com.healthsync.project.plan.dto.CreateMetricsRequest;
import com.healthsync.project.plan.dto.GoalMetricsDto;
import com.healthsync.project.plan.dto.PlanSummaryResponse;
import com.healthsync.project.plan.repository.GoalMetricsRepository;
import com.healthsync.project.plan.service.PlanCalcService;
import com.healthsync.project.plan.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/plan")
public class PlanController {

    private final PlanService planService;
    private final PlanCalcService calc;
    private final GoalMetricsRepository metricsRepo;

    // ─────────────────────────────────────────────────────────────────────────
    // 요약(권장섭취 포함)
    // - DB 스냅샷(goal_metrics) 우선
    // - 없으면 기존 계산
    // - mealsPerDay 쿼리 파라미터가 오면 끼니 kcal은 그 값을 기준으로 즉시 재계산
    // - 다양한 프론트 경로를 모두 받아주도록 매핑 추가
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping({"/{goalId}/summary", "/summary/{goalId}", "/goals/{goalId}/summary"})
    public PlanSummaryResponse summaryPath(
            @PathVariable Long goalId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer tdee,
            @RequestParam(required = false) String sex,
            @RequestParam(required = false, name = "mealsPerDay") Integer mealsOverride
    ) {
        return buildSummary(goalId, userId, tdee, sex, mealsOverride);
    }

    // 프론트가 `/api/plan/summary?goalId=...` 형태로 부를 수도 있으니 안전망 매핑 추가
    @GetMapping("/summary")
    public PlanSummaryResponse summaryQuery(
            @RequestParam Long goalId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer tdee,
            @RequestParam(required = false) String sex,
            @RequestParam(required = false, name = "mealsPerDay") Integer mealsOverride
    ) {
        return buildSummary(goalId, userId, tdee, sex, mealsOverride);
    }

    private PlanSummaryResponse buildSummary(
            Long goalId,
            Long userId,
            Integer tdee,
            String sex,
            Integer mealsOverride
    ) {
        Goal goal = planService.get(goalId, userId);

        // 0) DB 스냅샷 우선
        GoalMetrics gm = metricsRepo.findByGoalId(goal.getId()).orElse(null);
        if (gm != null) {
            Integer tdeeEff = (tdee != null) ? tdee : gm.getTdeeBaseline();
            String  sexEff  = (sex  != null && !sex.isBlank()) ? sex : gm.getSex();

            int weeks   = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
            double sKg  = goal.getStartWeightKg().doubleValue();
            double tKg  = goal.getTargetWeightKg().doubleValue();
            int meals   = (mealsOverride != null && mealsOverride > 0)
                    ? mealsOverride
                    : (gm.getMealsPerDay() != null ? gm.getMealsPerDay()
                    : (goal.getMealsPerDay() != null ? goal.getMealsPerDay() : 3));

            var res = new PlanSummaryResponse();
            res.setGoalId(goal.getId());
            res.setType(goal.getType().name());
            res.setStartDate(goal.getStartDate().toString());
            res.setWeeks(weeks);
            res.setMealsPerDay(meals);

            res.setTdee(tdeeEff);
            res.setDailyDeltaRaw(gm.getDailyDeltaRaw());
            res.setDailyDeltaApplied(gm.getDailyDeltaApplied());
            res.setTargetDailyCalories(gm.getTargetDailyKcal());

            // perMeal: 스냅샷값이 있더라도, 프론트에서 mealsPerDay를 바꾸면 즉시 재계산
            Integer perMeal = calc.perMeal(gm.getTargetDailyKcal(), meals);
            res.setPerMealKcal(perMeal);

            var ratio = new HashMap<String, Integer>();
            ratio.put("carb", gm.getRatioCarb());
            ratio.put("protein", gm.getRatioProt());
            ratio.put("fat", gm.getRatioFat());
            res.setMacroRatio(ratio);

            // 경고/부울 플래그 복원
            boolean clampedByType = false;
            if (gm.getDailyDeltaRaw() != null && gm.getDailyDeltaApplied() != null
                    && !gm.getDailyDeltaRaw().equals(gm.getDailyDeltaApplied())) {
                clampedByType = true;
            }
            boolean clampedByFloor = false;
            if (gm.getTargetDailyKcal() != null && tdeeEff != null && gm.getDailyDeltaRaw() != null) {
                int before = tdeeEff + gm.getDailyDeltaRaw();
                int after  = gm.getTargetDailyKcal();
                if (after != before) clampedByFloor = true;
            } else {
                try {
                    int before = (tdeeEff != null ? tdeeEff : 0) + (gm.getDailyDeltaRaw() != null ? gm.getDailyDeltaRaw() : 0);
                    int after  = calc.applyFloor(before, sexEff);
                    if (after != before) clampedByFloor = true;
                } catch (Exception ignored) {}
            }
            res.setClampedByTypeLimit(clampedByType);
            res.setClampedByFloor(clampedByFloor);

            var warnings = new ArrayList<String>();
            try {
                calc.collectWarnings(
                        warnings,
                        goal.getType(),
                        sKg, tKg, weeks,
                        tdeeEff,
                        gm.getTargetDailyKcal() != null ? gm.getTargetDailyKcal() : Integer.MAX_VALUE
                );
            } catch (Exception ignored) {}
            if (clampedByType) warnings.add(
                    goal.getType().name().equals("LEAN")
                            ? "감량 한도 적용으로 권장 섭취가 상향 조정되었습니다."
                            : "증량 한도 적용으로 권장 섭취가 하향 조정되었습니다."
            );
            if (clampedByFloor) warnings.add(
                    (sexEff != null && sexEff.equalsIgnoreCase("M"))
                            ? "남성 하한(1500 kcal/일) 적용됨."
                            : "여성 하한(1200 kcal/일) 적용됨."
            );
            res.setWarnings(warnings);

            log.info("[Summary][DB] goalId={}, targetDailyKcal={}, perMeal={}, tdeeBaseline={}, mealsPerDay={}",
                    goal.getId(), gm.getTargetDailyKcal(), perMeal, gm.getTdeeBaseline(), meals);

            return res;
        }

        // 1) 스냅샷이 없으면 기존 계산 경로
        int weeks      = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        double startKg = goal.getStartWeightKg().doubleValue();
        double targetKg= goal.getTargetWeightKg().doubleValue();
        int meals      = (mealsOverride != null && mealsOverride > 0)
                ? mealsOverride
                : (goal.getMealsPerDay() != null ? goal.getMealsPerDay() : 3);

        int dailyDeltaRaw = calc.calcDailyDelta(startKg, targetKg, weeks);
        int dailyDeltaApplied = calc.clampByPlanLimit(goal.getType(), dailyDeltaRaw, tdee);
        boolean clampedByType = (dailyDeltaApplied != dailyDeltaRaw);

        Integer targetDaily = (tdee != null) ? (tdee + dailyDeltaApplied) : null;

        boolean clampedByFloor = false;
        if (targetDaily != null) {
            int afterFloor = calc.applyFloor(targetDaily, sex);
            if (afterFloor != targetDaily) {
                clampedByFloor = true;
                dailyDeltaApplied = afterFloor - tdee;
                targetDaily = afterFloor;
            }
        }

        var ratio2 = calc.ratioFor(goal.getType());

        var res = new PlanSummaryResponse();
        res.setGoalId(goal.getId());
        res.setType(goal.getType().name());
        res.setStartDate(goal.getStartDate().toString());
        res.setWeeks(weeks);
        res.setMealsPerDay(meals);

        res.setTdee(tdee);
        res.setDailyDeltaRaw(dailyDeltaRaw);
        res.setDailyDeltaApplied(dailyDeltaApplied);
        res.setTargetDailyCalories(targetDaily);
        res.setPerMealKcal(calc.perMeal(targetDaily, meals));
        res.setMacroRatio(ratio2);

        if (targetDaily != null) {
            var perDayG  = calc.macroGPerDay(targetDaily, ratio2);
            var perMealG = calc.macroGPerMeal(perDayG, meals);
            res.setMacroPerDayG(perDayG);
            res.setMacroPerMealG(perMealG);
        }

        var warnings = new ArrayList<String>();
        calc.collectWarnings(warnings, goal.getType(), startKg, targetKg, weeks, tdee,
                targetDaily != null ? targetDaily : Integer.MAX_VALUE);
        if (clampedByType)  warnings.add(
                goal.getType().name().equals("LEAN")
                        ? "감량 한도 적용으로 권장 섍취가 상향 조정되었습니다."
                        : "증량 한도 적용으로 권장 섭취가 하향 조정되었습니다."
        );
        if (clampedByFloor) warnings.add((sex != null && sex.equalsIgnoreCase("M"))
                ? "남성 하한(1500 kcal/일) 적용됨." : "여성 하한(1200 kcal/일) 적용됨.");
        res.setWarnings(warnings);

        log.info("[Summary][Calc] goalId={}, targetDailyKcal={}, perMeal={}, tdee={}, mealsPerDay={}",
                goal.getId(), targetDaily, res.getPerMealKcal(), tdee, meals);

        return res;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 스냅샷 저장/조회
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/goals/{goalId}/metrics")
    public GoalMetricsDto snapshotMetrics(
            @PathVariable Long goalId,
            @RequestParam(required = false) Long userId,
            @RequestBody CreateMetricsRequest req
    ) {
        Goal goal = planService.get(goalId, userId);
        var m = planService.upsertMetrics(goal, req.getTdee(), req.getSex(), req.getMealsPerDay());
        return GoalMetricsDto.from(m);
    }

    @GetMapping("/goals/{goalId}/metrics")
    public GoalMetricsDto getMetrics(
            @PathVariable Long goalId,
            @RequestParam(required = false) Long userId
    ) {
        Goal g = planService.get(goalId, userId);
        var m = metricsRepo.findByGoalId(g.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return GoalMetricsDto.from(m);
    }
}
