package com.healthsync.project.calc.dto;

import com.healthsync.project.calc.domain.Metrics;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetricsResponse {

    private BigDecimal bmi;               // 계산된 BMI 값
    private String category;              // BMI 분류
    private BigDecimal standardWeight;    // 표준체중
    private BigDecimal dailyCalories;     // 하루 권장 칼로리
    private BigDecimal bmr;               // 기초대사량
    private BigDecimal activityCalories;  // 활동대사량

    // ✅ [추가] Metrics 엔티티를 DTO로 변환하는 정적 메서드
    public static MetricsResponse fromEntity(Metrics metrics) {
        return MetricsResponse.builder()
                .bmi(metrics.getBmi())
                .category(metrics.getCategory())
                .standardWeight(metrics.getStandardWeight())
                .dailyCalories(metrics.getDailyCalories())
                .bmr(metrics.getBmr())
                .activityCalories(metrics.getActivityCalories())
                .build();
    }
}