package com.healthsync.project.plan.service;

import com.healthsync.project.account.profile.history.WeightLog;
import com.healthsync.project.account.profile.history.WeightLogRepository;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.PlanDuration;
import com.healthsync.project.plan.domain.PlanDurationPreset;
import com.healthsync.project.plan.dto.CreateGoalReq;
import com.healthsync.project.plan.dto.GoalDto;
import com.healthsync.project.plan.repository.GoalRepository;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final ProfileRepository profileRepository; //프로필의 현재 몸무게를 수정하도록 작업
    private final WeightLogRepository weightLogRepository; // 프로필의 당시 기준 몸무게를 저장해두어 데이터 꼬임방지
    private final CurrentUserIdResolver current;


    /**
     * 생성
     */
    @Transactional
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

        // 같은 시작일 + 같은 주차면 기존 목표 덮어쓰기(업데이트)
        var dup = goalRepository.findByUserIdAndStartDateAndDuration_Weeks(
                userId, req.startDate(), req.weeks());

        if (dup.isPresent()) {
            Goal g = dup.get();
            g.overwriteSameSlot(req.type(), req.startWeightKg(), req.targetWeightKg());
            // 주차/시작일 동일이므로 변경 없음
            //  덮어쓰기 시에는 WeightLog 스냅샷 추가하지 않음(원하면 여기에 추가 가능)
            return GoalDto.from(g);
        }
        //그냥 엔티티 생성 & 저장
        Goal saved = goalRepository.save(new Goal(
                userId,
                req.type(),
                req.startDate(),
                PlanDuration.of(req.weeks()),
                req.startWeightKg(),
                req.targetWeightKg()
        ));

        //  프로필 '기본 체중'은 비어있을 때만 1회 세팅 (덮어쓰지 않음)
        profileRepository.findByUserId(userId).ifPresent(p -> {
            if (p.getWeight() == null) {
                p.setWeight(req.startWeightKg());
            }
        });

        //  시작 스냅샷은 최초 생성시에만 남김
        weightLogRepository.save(WeightLog.builder()
                .userId(userId)
                .weight(req.startWeightKg())
                .build());

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

