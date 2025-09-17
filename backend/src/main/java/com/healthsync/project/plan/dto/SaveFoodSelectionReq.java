package com.healthsync.project.plan.dto;

import com.healthsync.project.plan.domain.MacroCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveFoodSelectionReq(
        @NotNull Long goalId,
        @NotNull MacroCategory category, //CARB,PROTEIN,FAT
        @NotBlank String label, //쌀밥 200g
        Double servingG,
        @NotNull @Min(0) Integer kcal,
        @NotNull Double carbsG,
        @NotNull Double proteinG,
        @NotNull Double fatG,
        @NotBlank String source,   //"Nutri_api", "custom"
        String externalId   //Nutri 식별자
) {
}
