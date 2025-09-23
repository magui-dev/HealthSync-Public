package com.healthsync.project.plan.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WeighInDto(Long id, Long goalId, BigDecimal weight, LocalDateTime recordedAt) {
}
