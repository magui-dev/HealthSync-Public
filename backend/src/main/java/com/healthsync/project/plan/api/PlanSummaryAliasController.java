package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.PlanSummaryDto;
import com.healthsync.project.plan.service.PlanSummaryService;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
public class PlanSummaryAliasController {

    private final PlanSummaryService summaryService;
    private final CurrentUserIdResolver currentUser;

    // 프론트 호환용: /api/plan/summary/{id} → 실제 요약 서비스로 위임
    @GetMapping("/summary/{id}")
    public PlanSummaryDto summaryAlias(
            @PathVariable("id") Long goalId,
            @RequestParam(value = "tdee",        required = false) Integer tdee,
            @RequestParam(value = "sex",         required = false) String  sex,         // "M" | "F" | null
            @RequestParam(value = "mealsPerDay", required = false) Integer mealsPerDay  // 없으면 3
    ) {
        Long userId = currentUser.requireCurrentUserId();
        return summaryService.summary(userId, goalId, tdee, sex, mealsPerDay);
    }
}
