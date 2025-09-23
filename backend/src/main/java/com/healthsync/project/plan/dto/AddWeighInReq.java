package com.healthsync.project.plan.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AddWeighInReq(Long goalId, BigDecimal weight, LocalDateTime recordedAt) {

}
