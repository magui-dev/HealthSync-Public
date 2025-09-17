package com.healthsync.project.plan.dto;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalDto (
        Long id,
        Long userId,
        GoalType type,
        int weeks,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal startWeightKg,
        BigDecimal targetWeightKg
) {
    public static GoalDto from(Goal g) {
        return new GoalDto(
                g.getId(),
                g.getUserId(),
                g.getType(),
                g.getDuration().value(),
                g.getStartDate(),
                g.getEndDate(),
                g.getStartWeightKg(),
                g.getTargetWeightKg()
        );
    }
}

