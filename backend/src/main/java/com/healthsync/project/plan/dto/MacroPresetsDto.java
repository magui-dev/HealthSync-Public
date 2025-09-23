package com.healthsync.project.plan.dto;

import java.util.List;

public record MacroPresetsDto (
    List<Item> carb,
    List<Item> protein,
    List<Item> fat
) {
    public record Item(String key, String name, String icon, Integer kclaPer100g){

    }
}
