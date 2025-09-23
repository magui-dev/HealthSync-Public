package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.AddWeighInReq;
import com.healthsync.project.plan.dto.ProgressDto;
import com.healthsync.project.plan.dto.WeighInDto;
import com.healthsync.project.plan.service.ProgressService;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/plan")
public class PlanProgressController {
    private final ProgressService progress;
    private final CurrentUserIdResolver current;

    @PostMapping("/weigh-ins")
    @ResponseStatus(HttpStatus.CREATED)
    public WeighInDto add(@RequestBody AddWeighInReq req) {
        Long userId = current.requireCurrentUserId();
        return progress.add(userId, req.goalId(), req.weight(), req.recordedAt());
    }

    @GetMapping("/weigh-ins/{goalId}")
    public List<WeighInDto> list(@PathVariable Long goalId) {
        Long userId = current.requireCurrentUserId();
        return progress.list(userId, goalId);
    }

    @GetMapping("/progress/{goalId}")
    public ProgressDto progress(@PathVariable Long goalId) {
        Long userId = current.requireCurrentUserId();
        return progress.progress(userId, goalId);
    }

}
