package com.healthsync.project.plan.dto;

import com.healthsync.project.plan.domain.FoodSelection;
import com.healthsync.project.plan.domain.MacroCategory;

/** 내 픽 조회 응답 */
public record FoodSelectionDto(
        Long id, Long goalId, MacroCategory category,
        String label, Double servingG, Integer kcal,
        Double carbsG, Double proteinG, Double fatG,
        String source, String externalId
){
    public static FoodSelectionDto from(FoodSelection f){
        return new FoodSelectionDto(
                f.getId(), f.getGoalId(), f.getCategory(),
                f.getLabel(), f.getServingG(), f.getKcal(),
                f.getCarbsG(), f.getProteinG(), f.getFatG(),
                f.getSource(), f.getExternalId()
        );
    }
}
