package com.healthsync.project.calc.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Metrics")
public class Metrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private double bmi;               // 계산된 BMI 값
    private String category;          // BMI 분류
    private double standardWeight;    // 표준체중
    private double dailyCalories;     // 하루 권장 칼로리
    private double bmr;               // 기초대사량
    private double activityCalories;  // 활동대사량

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private CalcProfile profile;
}