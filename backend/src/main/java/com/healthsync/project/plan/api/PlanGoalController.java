package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.CreateGoalReq;
import com.healthsync.project.plan.dto.GoalDto;
import com.healthsync.project.plan.service.GoalService;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/plan 이하 엔드포인트는 현재 로그인 사용자 기준으로만 동작
 * - 클라이언트로부터 userId를 받지 않음(보안)
 */
@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
public class PlanGoalController {

    private final GoalService goalService;
    private final CurrentUserIdResolver currentUserId;

    /** 목표 생성 */
    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalDto create(@RequestBody @Valid CreateGoalReq req) {
        Long userId = currentUserId.requireCurrentUserId();
        return goalService.create(userId, req);
    }

    /** 내 목표 목록 */
    @GetMapping("/goals")
    public List<GoalDto> listMine() {
        Long userId = currentUserId.requireCurrentUserId();
        return goalService.list(userId);
    }

    /** 내 목표 단건 조회 */
    @GetMapping("/goals/{id}")
    public GoalDto get(@PathVariable Long id) {
        Long userId = currentUserId.requireCurrentUserId();
        return goalService.get(userId, id);
    }
}
