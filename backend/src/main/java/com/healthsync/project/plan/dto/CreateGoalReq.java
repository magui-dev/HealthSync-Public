package com.healthsync.project.plan.dto;

import com.healthsync.project.plan.domain.GoalType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 생성 요청 DTO
 *  userId는 받지않음
 */
public record CreateGoalReq (
        @NotNull GoalType type,   // lean | health
        @Min(2) @Max(16) int weeks,       // 2,4,6,8,10,12,14,16
        @NotNull LocalDate startDate,   // YYYY-MM-DD
        @NotNull @DecimalMin("0.0") BigDecimal startWeightKg, //음수(-)금지
        @NotNull @DecimalMin("0.0") BigDecimal targetWeightKg
    ){
    // 2,4,6,...,16만 허용(요청단 첫 번째 방어막)
    @AssertTrue(message = "weeks must be one of {2,4,6,8,10,12,14,16}")
    public boolean isWeeksPresetAllowed() {
        return switch (weeks) { case 2,4,6,8,10,12,14,16 -> true; default -> false; };
    }
}
