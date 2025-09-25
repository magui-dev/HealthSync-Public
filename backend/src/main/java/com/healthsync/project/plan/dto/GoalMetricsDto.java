package com.healthsync.project.plan.dto;

import com.healthsync.project.plan.domain.GoalMetrics;
import lombok.Data;

@Data
public class GoalMetricsDto {
    private Long goalId;
    private Integer tdeeBaseline;
    private String sex;
    private Integer dailyDeltaRaw;
    private Integer dailyDeltaApplied;
    private Integer targetDailyKcal;
    private Integer perMealKcal;
    private Integer ratioCarb;
    private Integer ratioProt;
    private Integer ratioFat;

    public static GoalMetricsDto from(GoalMetrics m) {
        GoalMetricsDto d = new GoalMetricsDto();
        d.setGoalId(m.getGoal().getId());
        d.setTdeeBaseline(m.getTdeeBaseline());
        d.setSex(m.getSex());
        d.setDailyDeltaRaw(m.getDailyDeltaRaw());
        d.setDailyDeltaApplied(m.getDailyDeltaApplied());
        d.setTargetDailyKcal(m.getTargetDailyKcal());
        d.setPerMealKcal(m.getPerMealKcal());
        d.setRatioCarb(m.getRatioCarb());
        d.setRatioProt(m.getRatioProt());
        d.setRatioFat(m.getRatioFat());
        return d;
    }
}
