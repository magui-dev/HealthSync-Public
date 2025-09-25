package com.healthsync.project.plan.dto;

import java.util.List;

public record PlanSummaryDto(
        boolean profileReady,
        List<String> missingFields,  //프로필 미입력시 어떤게 필요한지 힌트.
        Integer tdee,  //null: 프로필 미연동
        Integer dailyKcal,
        Integer mealsPerDay,
        Integer perMealKcal,
        MacroRatio macroRatio,   // % 예시 50/30/20
        MacroGrams macroDaily,
        MacroGrams macroRerMeal,
        List<ForecastPoint> forecast   //주차별 예상체중


) {
    public record MacroRatio(int carb, int protein, int fat) { }
    public record MacroGrams(int carb_g, int protein_g, int fat_g){ }
    public record ForecastPoint(int week, double expectedWeightKg){ }
}
