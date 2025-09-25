package com.healthsync.project.plan.api;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.dto.CreateMetricsRequest;
import com.healthsync.project.plan.dto.GoalMetricsDto;
import com.healthsync.project.plan.dto.PlanSummaryResponse;
import com.healthsync.project.plan.service.PlanCalcService;
import com.healthsync.project.plan.service.PlanService;
import com.healthsync.project.plan.repository.GoalMetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/plan")
public class PlanController {

    private final PlanService planService;
    private final PlanCalcService calc;
    private final GoalMetricsRepository metricsRepo;

    /** 요약 계산 (저장 X) — 기존 summary 엔드포인트 유지 */
    @GetMapping({"/{goalId}/summary", "/summary/{goalId}", "/goals/{goalId}/summary"})
    public PlanSummaryResponse summary(
            @PathVariable Long goalId,
            @RequestParam(required = false) Long userId, // 인증 미연결 대비
            @RequestParam(required = false) Integer tdee,
            @RequestParam(required = false) String sex
    ) {
        Goal goal = planService.get(goalId, userId);

        int weeks      = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        double startKg = goal.getStartWeightKg().doubleValue();
        double targetKg= goal.getTargetWeightKg().doubleValue();
        int meals      = (goal.getMealsPerDay() != null) ? goal.getMealsPerDay() : 3;

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

        var ratio = calc.ratioFor(goal.getType());

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
        res.setMacroRatio(ratio);

        if (targetDaily != null) {
            var perDayG  = calc.macroGPerDay(targetDaily, ratio);
            var perMealG = calc.macroGPerMeal(perDayG, meals);
            res.setMacroPerDayG(perDayG);
            res.setMacroPerMealG(perMealG);
        }

        var warnings = new ArrayList<String>();
        calc.collectWarnings(warnings, goal.getType(), startKg, targetKg, weeks, tdee,
                targetDaily != null ? targetDaily : Integer.MAX_VALUE);
        if (clampedByType)  warnings.add(
                goal.getType().name().equals("LEAN")
                        ? "감량 한도 적용으로 권장 섭취가 상향 조정되었습니다."
                        : "증량 한도 적용으로 권장 섭취가 하향 조정되었습니다."
        );
        if (clampedByFloor) warnings.add((sex != null && sex.equalsIgnoreCase("M"))
                ? "남성 하한(1500 kcal/일) 적용됨." : "여성 하한(1200 kcal/일) 적용됨.");
        res.setWarnings(warnings);

        return res;
    }

    /** (신규) 목표 스냅샷 저장/갱신 */
    @PostMapping("/goals/{goalId}/metrics")
    public GoalMetricsDto snapshotMetrics(
            @PathVariable Long goalId,
            @RequestParam(required = false) Long userId,     // 인증 미연결 대비
            @RequestBody CreateMetricsRequest req
    ) {
        Goal goal = planService.get(goalId, userId);
        var m = planService.upsertMetrics(goal, req.getTdee(), req.getSex(), req.getMealsPerDay());
        return GoalMetricsDto.from(m);
    }

    /** (신규) 목표 스냅샷 조회 */
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
