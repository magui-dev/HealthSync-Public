package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.PlanSummaryDto;
import com.healthsync.project.plan.service.PlanSummaryService;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plan/goals")
@RequiredArgsConstructor
public class PlanSummaryController {
    private final PlanSummaryService summaryService;
    private final CurrentUserIdResolver currentUser;

    @GetMapping("/{id}/summary")
    public PlanSummaryDto summary(@PathVariable("id") Long goalId) {
        Long userId = currentUser.requireCurrentUserId();
        return summaryService.summary(userId, goalId);
    }
}
