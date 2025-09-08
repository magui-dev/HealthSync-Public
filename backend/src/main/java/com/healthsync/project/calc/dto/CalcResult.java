package com.healthsync.project.calc.dto;

import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "calc")
public class CalcResult {

    private double bmi;               // 계산된 BMI 값
    private String category;          // BMI 분류
    private double standardWeight;    // 표준체중
    private double dailyCalories;     // 하루 권장 칼로리
    private double bmr;               // 기초대사량
    private double activityCalories;  // 활동대사량
}
