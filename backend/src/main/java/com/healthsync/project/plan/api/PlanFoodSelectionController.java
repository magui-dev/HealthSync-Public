package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.FoodSelectionDto;
import com.healthsync.project.plan.dto.SaveFoodSelectionReq;
import com.healthsync.project.plan.service.FoodSelectionService;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 내 픽(탄/단/지) 저장/조회 API
 */
@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
public class PlanFoodSelectionController {

    private final FoodSelectionService service;
    private final CurrentUserIdResolver currentUser;

    /** 저장/교체: 동일 goal×category면 교체(upsert) */
    @PostMapping("/food-selections")
    @ResponseStatus(HttpStatus.CREATED)
    public FoodSelectionDto save(@RequestBody @Valid SaveFoodSelectionReq req){
        Long userId = currentUser.requireCurrentUserId();
        return service.saveOrReplace(userId, req);
    }

    /** 내 픽 목록(최대 3개: CARB/PROTEIN/FAT) */
    @GetMapping("/food-selections")
    public List<FoodSelectionDto> list(@RequestParam Long goalId){
        Long userId = currentUser.requireCurrentUserId();
        return service.listByGoal(userId, goalId);
    }
}
