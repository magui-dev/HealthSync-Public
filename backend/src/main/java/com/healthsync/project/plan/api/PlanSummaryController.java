//package com.healthsync.project.plan.api;
//
//import com.healthsync.project.plan.dto.PlanSummaryDto;
//import com.healthsync.project.plan.service.PlanSummaryService;
//import com.healthsync.project.plan.support.CurrentUserIdResolver;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/plan/goals")
//@RequiredArgsConstructor
//public class PlanSummaryController {
//    private final PlanSummaryService summaryService;
//    private final CurrentUserIdResolver currentUser;
//
//    @GetMapping("/{id}/summary")
//    public PlanSummaryDto summary(
//            @PathVariable("id") Long goalId,
//            @RequestParam(value = "tdee",        required = false) Integer tdee,
//            @RequestParam(value = "sex",         required = false) String  sex,         // "M" | "F" | null
//            @RequestParam(value = "mealsPerDay", required = false) Integer mealsPerDay  // 없으면 3
//    ) {
//        Long userId = currentUser.getOrNull(); // ★ 예외 대신 null 가능
//        return summaryService.summary(userId, goalId, tdee, sex, mealsPerDay);
//    }
//}
