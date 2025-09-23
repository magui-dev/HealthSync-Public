package com.healthsync.project.plan.service;

import com.healthsync.project.plan.dto.MacroPresetsDto;
import com.healthsync.project.plan.dto.MacroPresetsDto.Item;
import com.healthsync.project.nutri.service.NutriService; // ← 프로젝트에 있는 nutri 조회 서비스/클라이언트 사용
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PresetService {
    private final NutriService nutri; // search(q) → kcalPer100g 반환(또는 영양소로 계산)

    // 아이콘 key ↔ 식품명 매핑 (아이콘은 프론트에서 key 기준으로 이미 존재)
    private static final List<Item> CARB = List.of(
            new Item("brown-rice", "현미밥", "brown-rice", null),
            new Item("sweet-potato", "고구마", "sweet-potato", null),
            new Item("oatmeal", "오트밀", "oatmeal", null)
    );
    private static final List<Item> PROTEIN = List.of(
            new Item("chicken-breast", "닭가슴살", "chicken-breast", null),
            new Item("tofu", "두부", "tofu", null),
            new Item("eggs", "계란", "eggs", null)
    );
    private static final List<Item> FAT = List.of(
            new Item("olive-oil", "올리브유", "olive-oil", null),
            new Item("avocado", "아보카도", "avocado", null),
            new Item("almond", "아몬드", "almond", null)
    );

    public MacroPresetsDto getPresets() {
        return new MacroPresetsDto(
                enrich(CARB),
                enrich(PROTEIN),
                enrich(FAT)
        );
    }

    private List<Item> enrich(List<Item> items) {
        return items.stream().map(i -> {
            Integer kcal = nutri.findKcalPer100g(i.name()); // ← nutri 쪽에서 100g 기준 kcal 리턴
            return new Item(i.key(), i.name(), i.icon(), kcal != null ? kcal : 0);
        }).toList();
    }
}
