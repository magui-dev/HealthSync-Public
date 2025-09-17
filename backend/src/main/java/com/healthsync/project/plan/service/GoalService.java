package com.healthsync.project.plan.service;

import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.PlanDuration;
import com.healthsync.project.plan.domain.PlanDurationPreset;
import com.healthsync.project.plan.dto.CreateGoalReq;
import com.healthsync.project.plan.dto.GoalDto;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    /**
     * 생성
     */

    public GoalDto create(Long userId, CreateGoalReq req) {
        //--입력 검증
        if (userId == null) throw new IllegalArgumentException("userId 는 필수 입니다.");
        if (!PlanDurationPreset.isAllowed(req.weeks())) {
            throw new IllegalArgumentException("목표 기간은 [2,4,6,8,10,12,14,16]주 중 하나여야 합니다.");
        }
        if (req.startDate() == null)
            throw new IllegalArgumentException("시작일(StartDate)은 필수 입니다.");
        if (req.startWeightKg() == null || req.targetWeightKg() == null)
            throw new IllegalArgumentException("시작일/목표일 은 필수 입니다. ");

        //엔티티 생성 & 저장
        Goal saved = goalRepository.save(new Goal(
                userId,
                req.type(),
                req.startDate(),
                PlanDuration.of(req.weeks()),
                req.startWeightKg(),
                req.targetWeightKg()
        ));
        return GoalDto.from(saved);
    }

    /**
     * 단건 조회 본인것만
     */
    @Transactional(readOnly = true)
    public GoalDto get(Long userId, Long goalId) {
        var g = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("목표를 찾을수 없습니다. : id = " + goalId));
        if (!g.getUserId().equals(userId))
            throw new IllegalArgumentException(" Forbidden : not your goal");
        return GoalDto.from(g);
    }

    /**
     * 내목표 목록
     */

    public List<GoalDto> list(Long userId) {
        var list = goalRepository.findAllByUserIdOrderByStartDateDesc(userId);
        var result = new ArrayList<GoalDto>(list.size());
        for (var g : list) result.add(GoalDto.from(g));
        return result;
    }
}

