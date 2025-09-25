package com.healthsync.project.plan.service;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalSummary;
import com.healthsync.project.plan.domain.GoalType;
import com.healthsync.project.plan.repository.GoalSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GoalSummaryWriter {

    private final PlanCalcService calc;                 // ✓ 네가 이미 갖고 있는 계산 유틸(@Component)
    private final GoalSummaryRepository summaries;

    // 플랜 타입별 비율 preset (GoalSummary에 % 저장)
    private static final Map<GoalType, int[]> MACRO_PRESET = Map.of(
            GoalType.LEAN,   new int[]{40,35,25},
            GoalType.HEALTH, new int[]{45,35,20}
    );

    /** Goal 저장/수정 직후 호출: 요약 계산 → GoalSummary upsert */
    @Transactional
    public GoalSummary computeAndSave(Goal g, Integer tdeeParam /*nullable*/) {
        int weeks       = g.getDuration().value();
        double startKg  = g.getStartWeightKg().doubleValue();
        double targetKg = g.getTargetWeightKg().doubleValue();
        int meals       = g.getMealsPerDay() != null && g.getMealsPerDay() > 0 ? g.getMealsPerDay() : 3;
        String sex      = g.getSex(); // "M" | "F" | null

        Integer tdee = (tdeeParam != null && tdeeParam > 0) ? tdeeParam : null;

        // 1) delta → clamp → floor → targetDaily/perMeal
        int deltaRaw      = calc.calcDailyDelta(startKg, targetKg, weeks);
        int deltaApplied  = calc.clampByPlanLimit(g.getType(), deltaRaw, tdee);
        Integer targetDaily = (tdee != null) ? (tdee + deltaApplied) : null;
        if (targetDaily != null) targetDaily = calc.applyFloor(targetDaily, sex);
        Integer perMealKcal = calc.perMeal(targetDaily, meals);

        // 2) 매크로 비율/그램
        int[] rp = MACRO_PRESET.getOrDefault(g.getType(), new int[]{40,40,20});
        Map<String,Integer> ratioMap = Map.of("carb", rp[0], "protein", rp[1], "fat", rp[2]);

        Integer carbDay=null, protDay=null, fatDay=null, carbMeal=null, protMeal=null, fatMeal=null;
        if (targetDaily != null) {
            Map<String,Integer> perDay  = calc.macroGPerDay(targetDaily, ratioMap);
            carbDay  = perDay.get("carb"); protDay = perDay.get("protein"); fatDay  = perDay.get("fat");
            Map<String,Integer> pMeal = calc.macroGPerMeal(perDay, meals);
            carbMeal = pMeal.get("carb"); protMeal = pMeal.get("protein"); fatMeal = pMeal.get("fat");
        }

        // 3) 경고
        List<String> warns = new ArrayList<>();
        calc.collectWarnings(warns, g.getType(), startKg, targetKg, weeks, tdee, targetDaily != null ? targetDaily : 0);

        // 4) upsert
        GoalSummary sum = GoalSummary.builder()
                .goalId(g.getId())
                .tdee(tdee)
                .deltaRaw(deltaRaw)
                .deltaApplied(deltaApplied)
                .targetDailyKcal(targetDaily)
                .perMealKcal(perMealKcal)
                .mealsPerDay(meals)
                .macroCarbPct(rp[0]).macroProtPct(rp[1]).macroFatPct(rp[2])
                .macroCarbGDay(carbDay).macroProtGDay(protDay).macroFatGDay(fatDay)
                .macroCarbGMeal(carbMeal).macroProtGMeal(protMeal).macroFatGMeal(fatMeal)
                .warningsText(warns.isEmpty() ? null : String.join("\n", warns))
                .build();

        return summaries.save(sum);
    }
}
