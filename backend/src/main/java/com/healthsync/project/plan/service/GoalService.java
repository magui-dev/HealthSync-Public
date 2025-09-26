package com.healthsync.project.plan.service;

import com.healthsync.project.account.profile.history.WeightLog;
import com.healthsync.project.account.profile.history.WeightLogRepository;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.PlanDuration;
import com.healthsync.project.plan.domain.PlanDurationPreset;
import com.healthsync.project.plan.dto.CreateGoalReq;
import com.healthsync.project.plan.dto.GoalDto;
import com.healthsync.project.plan.dto.SavePlanRequest;
import com.healthsync.project.plan.repository.GoalRepository;
import com.healthsync.project.plan.support.CurrentUserIdResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import com.healthsync.project.plan.service.PlanService;
import org.springframework.web.server.ResponseStatusException;


@Slf4j
@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    // 💡 아래 3개는 이제 PlanService가 담당하므로 GoalService에서 직접 사용할 필요가 없습니다.
    // private final ProfileRepository profileRepository;
    // private final WeightLogRepository weightLogRepository;
    // private final CurrentUserIdResolver current;
    private final PlanService planService;

    /**
     * 생성
     */
    @Transactional
    public GoalDto create(Long userId, CreateGoalReq req) {
        log.info("[GoalService] create 요청. userId={}, weeks={}, startDate={}",
                userId, req.weeks(), req.startDate());
        //--입력 검증
        if (userId == null) throw new IllegalArgumentException("userId 는 필수 입니다.");
        if (!PlanDurationPreset.isAllowed(req.weeks())) {
            throw new IllegalArgumentException("목표 기간은 [2,4,6,8,10,12,14,16]주 중 하나여야 합니다.");
        }
        if (req.startDate() == null)
            throw new IllegalArgumentException("시작일(StartDate)은 필수 입니다.");
        if (req.startWeightKg() == null || req.targetWeightKg() == null)
            throw new IllegalArgumentException("시작/목표 체중은 필수 입니다. ");

        // 💡💡💡 [핵심 수정] 모든 로직을 PlanService에 위임합니다. 💡💡💡

        // 1. Controller에서 받은 DTO(CreateGoalReq)를 PlanService가 사용하는 DTO(SavePlanRequest)로 변환합니다.
        SavePlanRequest savePlanRequest = new SavePlanRequest();
        savePlanRequest.setType(req.type().name()); // GoalType Enum -> String
        savePlanRequest.setStartDate(req.startDate().toString()); // LocalDate -> String
        savePlanRequest.setWeeks(req.weeks());
        savePlanRequest.setStartWeightKg(req.startWeightKg().doubleValue()); // BigDecimal -> double
        savePlanRequest.setTargetWeightKg(req.targetWeightKg().doubleValue()); // BigDecimal -> double
        // 필요하다면 mealsPerDay 같은 다른 필드도 여기서 세팅합니다.
        // savePlanRequest.setMealsPerDay(req.mealsPerDay());

        // 2. 프로필 업데이트 및 goal_metrics 생성이 모두 포함된 PlanService.save를 호출합니다.
        Long goalId = planService.save(userId, savePlanRequest);

        log.info("[GoalService] PlanService를 통해 Goal 생성/업데이트 완료. goalId={}", goalId);

        // 3. 반환 타입에 맞게 생성된 Goal 정보를 DTO로 변환하여 반환합니다.
        return get(userId, goalId);
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

    public void deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));

        goalRepository.delete(goal);
    }
}



//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class GoalService {
//
//    private final GoalRepository goalRepository;
//    private final ProfileRepository profileRepository; //프로필의 현재 몸무게를 수정하도록 작업
//    private final WeightLogRepository weightLogRepository; // 프로필의 당시 기준 몸무게를 저장해두어 데이터 꼬임방지
//    private final CurrentUserIdResolver current;
//    private final PlanService planService;  //  목표 저장 직후 metrics 자동 스냅샷을 위해 PlanService 주입
//
//    /**
//     * 생성
//     */
//    @Transactional
//    public GoalDto create(Long userId, CreateGoalReq req) {
//        log.info("[GoalService] create userId={}, weeks={}, startDate={}",
//                userId, req.weeks(), req.startDate());
//        //--입력 검증
//        if (userId == null) throw new IllegalArgumentException("userId 는 필수 입니다.");
//        if (!PlanDurationPreset.isAllowed(req.weeks())) {
//            throw new IllegalArgumentException("목표 기간은 [2,4,6,8,10,12,14,16]주 중 하나여야 합니다.");
//        }
//        if (req.startDate() == null)
//            throw new IllegalArgumentException("시작일(StartDate)은 필수 입니다.");
//        if (req.startWeightKg() == null || req.targetWeightKg() == null)
//            throw new IllegalArgumentException("시작일/목표일 은 필수 입니다. ");
//
//        // 같은 시작일 + 같은 주차면 기존 목표 덮어쓰기(업데이트)
//        var dup = goalRepository.findByUserIdAndStartDateAndDuration_Weeks(
//                userId, req.startDate(), req.weeks());
//
//        if (dup.isPresent()) {
//            Goal g = dup.get();
//            g.overwriteSameSlot(req.type(), req.startWeightKg(), req.targetWeightKg());
//            log.info("[GoalService] overwrite slot -> call upsertMetrics goalId={}, sex={}",
//                    g.getId(), g.getSex());
//            //  덮어쓰기인 경우에도 metrics를 '덮어쓰기' (tdee/sex/meals 미정이면 null로)
//            //     sex은 Goal 엔티티에 값이 있으면 활용함(없으면 null)
//            planService.upsertMetrics(g, /*tdee*/ null, /*sex*/ g.getSex(), /*meals*/ null);
//
//            return GoalDto.from(g);
//        }
//        //그냥 엔티티 생성 & 저장
//        Goal saved = goalRepository.save(new Goal(
//                userId,
//                req.type(),
//                req.startDate(),
//                PlanDuration.of(req.weeks()),
//                req.startWeightKg(),
//                req.targetWeightKg()
//        ));
//
//        //  프로필 '기본 체중'은 비어있을 때만 1회 세팅 (덮어쓰지 않음)
//        log.info("[GoalService] created goalId={} -> call upsertMetrics sex={}",
//                saved.getId(), saved.getSex());
//        profileRepository.findByUserId(userId).ifPresent(p -> {
//            if (p.getWeight() == null) {
//                p.setWeight(req.startWeightKg());
//            }
//        });
//
//        //  시작 스냅샷은 최초 생성시에만 남김
//        weightLogRepository.save(WeightLog.builder()
//                .userId(userId)
//                .weight(req.startWeightKg())
//                .build());
//        // [ADD] 신규 생성 시에도 metrics를 '신규 생성' (tdee/sex/meals 미정이면 null로)
//        //       sex은 Goal 엔티티의 값 사용(없으면 null)
//        planService.upsertMetrics(saved, /*tdee*/ null, /*sex*/ saved.getSex(), /*meals*/ null);
//        return GoalDto.from(saved);
//    }
//
//    /**
//     * 단건 조회 본인것만
//     */
//    @Transactional(readOnly = true)
//    public GoalDto get(Long userId, Long goalId) {
//        var g = goalRepository.findById(goalId)
//                .orElseThrow(() -> new IllegalArgumentException("목표를 찾을수 없습니다. : id = " + goalId));
//        if (!g.getUserId().equals(userId))
//            throw new IllegalArgumentException(" Forbidden : not your goal");
//        return GoalDto.from(g);
//    }
//
//    /**
//     * 내목표 목록
//     */
//    public List<GoalDto> list(Long userId) {
//        var list = goalRepository.findAllByUserIdOrderByStartDateDesc(userId);
//        var result = new ArrayList<GoalDto>(list.size());
//        for (var g : list) result.add(GoalDto.from(g));
//        return result;
//    }
//
//    public void deleteGoal(Long goalId, Long userId) {
//        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
//
//        // 진행 중인 목표 삭제 제한 등을 하고 싶으면 여기서 검증
//        // if (goal.getStatus() == GoalStatus.ACTIVE) {
//        //     throw new ResponseStatusException(HttpStatus.CONFLICT, "Active goal cannot be deleted");
//        // }
//
//        goalRepository.delete(goal);
//        // Goal -> GoalMetrics 등 연관관계가 있으면
//        // 엔티티에 cascade = CascadeType.REMOVE 또는 orphanRemoval = true 설정 필요
//    }
//}
//
