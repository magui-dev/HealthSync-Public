package com.healthsync.project.plan.service;

import com.healthsync.project.plan.domain.FoodSelection;
import com.healthsync.project.plan.dto.FoodSelectionDto;
import com.healthsync.project.plan.dto.SaveFoodSelectionReq;
import com.healthsync.project.plan.repository.FoodSelectionRepository;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * goal×category 1개를 upsert.
 * - 권한 가드: 내 goal만 허용
 */
@Service
@RequiredArgsConstructor
public class FoodSelectionService {

    private final FoodSelectionRepository repo;
    private final GoalRepository goals;

    @Transactional
    public FoodSelectionDto saveOrReplace(Long userId, SaveFoodSelectionReq req){
        var g = goals.findById(req.goalId())
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        if (!g.getUserId().equals(userId))
            throw new IllegalArgumentException("Forbidden: not your goal");

        var existing = repo.findByGoalIdAndCategory(req.goalId(), req.category());
        FoodSelection saved = existing.map(f -> {
            f.replaceWith(req.label(), req.servingG(), req.kcal(),
                    req.carbsG(), req.proteinG(), req.fatG(),
                    req.source(), req.externalId());
            return f;
        }).orElseGet(() ->
                repo.save(FoodSelection.builder()
                        .userId(userId).goalId(req.goalId()).category(req.category())
                        .label(req.label()).servingG(req.servingG())
                        .kcal(req.kcal()).carbsG(req.carbsG()).proteinG(req.proteinG()).fatG(req.fatG())
                        .source(req.source()).externalId(req.externalId())
                        .build())
        );

        return FoodSelectionDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<FoodSelectionDto> listByGoal(Long userId, Long goalId){
        var g = goals.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        if (!g.getUserId().equals(userId))
            throw new IllegalArgumentException("Forbidden: not your goal");

        return repo.findAllByGoalIdOrderByCategoryAsc(goalId)
                .stream().map(FoodSelectionDto::from).toList();
    }
}
