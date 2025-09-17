package com.healthsync.project.calc.dto;

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

}