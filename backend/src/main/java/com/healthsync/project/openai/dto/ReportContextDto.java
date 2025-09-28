package com.healthsync.project.openai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReportContextDto {
    // UserProfile에서 오는 정보
    private String gender;
    private Integer age;
    private Double height;
    private Double activityLevel;

    // UserMetrics에서 오는 정보
    private Double bmi;
    private Double basalMetabolism;
    private Double dailyCalories; // TDEE (활동대사량)

    // PlanData + SelectedGoal에서 오는 정보
    private Double startWeightKg;
    private Double targetWeightKg;
    private Integer weeks;
    private String startDate;
    private String endDate;
    private Double targetDailyCalories; // 목표 일일 섭취량

    // me 객체에서 오는 정보
    private String nickname;
}