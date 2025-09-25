package com.healthsync.project.plan.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class PlanSummaryResponse {
    private Long goalId;
    private String type;              // "LEAN" | "HEALTH" (LeanFit=LEAN, BalanceFit=HEALTH)
    private String startDate;
    private int weeks;
    private int mealsPerDay;

    // 기준/결과 칼로리
    private Integer tdee;                 // 기준 TDEE (kcal/일)
    private Integer dailyDeltaRaw;        // 목표 기반 '원래' ±kcal/일
    private Integer dailyDeltaApplied;    // 한도/하한 적용 후 최종 ±kcal/일
    private Integer targetDailyCalories;  // 최종 권장 섭취 kcal/일 = tdee + dailyDeltaApplied
    private Integer perMealKcal;          // 끼니별 권장 kcal

    // 비율/그램
    private Map<String,Integer> macroRatio;     // 예) {carb:40, protein:35, fat:25}
    private Map<String,Integer> macroPerDayG;   // 예) {carb:230, protein:160, fat:65}
    private Map<String,Integer> macroPerMealG;  // 끼니별 g

    // 안전장치/경고
    private boolean clampedByTypeLimit;   // 플랜 한도(LeanFit/BalaceFit)로 clamp 되었는지
    private boolean clampedByFloor;       // kcal 하한(성별)에 막혔는지
    private List<String> warnings;        // 사용자에게 보여줄 경고 메시지들
}