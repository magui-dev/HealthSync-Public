package com.healthsync.project.plan.service;

import com.healthsync.project.calc.repository.MetricsRepository;
import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.domain.GoalMetrics;
import com.healthsync.project.plan.domain.GoalType;
import com.healthsync.project.plan.domain.PlanDuration;
import com.healthsync.project.plan.dto.SavePlanRequest;
import com.healthsync.project.plan.repository.GoalMetricsRepository;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.constant.GenderType;
import java.math.RoundingMode;



import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanService {

    private final GoalRepository repo;
    private final GoalMetricsRepository metricsRepo;
    private final MetricsRepository metricsRepository;
    private final PlanCalcService calc;
    private final ProfileRepository profileRepository;

    /**
     * 목표 저장 + 즉시 스냅샷(upsert)까지 수행
     *
     * @param userId       로그인 사용자
     * @param req          SavePlanRequest (type, startDate, weeks, start/target kg, mealsPerDay 등)
     * @param tdeeNullable 프로필 기반 TDEE (nullable)
     * @param sexNullable  "M"|"F"|null
     * @return goalId
     */
    @Transactional
    public Long save(Long userId, SavePlanRequest req, Integer tdeeNullable, String sexNullable) {

        // 💡💡💡 [핵심 수정] "덮어쓰기" 로직 추가 💡💡💡
        LocalDate startDate = LocalDate.parse(req.getStartDate());
        int weeks = req.getWeeks();

        Optional<Goal> dup = repo.findByUserIdAndStartDateAndDuration_Weeks(userId, startDate, weeks);


        Goal g; // 저장하거나 업데이트할 Goal 객체
        if (dup.isPresent()) {
            // 1. 기존 목표가 있으면, 해당 목표의 내용을 덮어씁니다.
            g = dup.get();
            g.overwriteSameSlot(
                    GoalType.from(req.getType()),
                    BigDecimal.valueOf(req.getStartWeightKg()),
                    BigDecimal.valueOf(req.getTargetWeightKg())
            );
            log.info("[PlanService] 기존 Goal을 덮어씁니다. goalId={}", g.getId());
        } else {
            // 2. 기존 목표가 없으면, 새로 생성합니다.
            g = new Goal(
                    userId,
                    GoalType.from(req.getType()),
                    startDate,
                    PlanDuration.of(weeks),
                    BigDecimal.valueOf(req.getStartWeightKg()),
                    BigDecimal.valueOf(req.getTargetWeightKg())
            );
            log.info("[PlanService] 신규 Goal을 생성합니다.");
        }

        int delta = calc.calcDailyDelta(req.getStartWeightKg(), req.getTargetWeightKg(), req.getWeeks());
        g.changeMealsPerDay(req.getMealsPerDay()); // null -> 내부에서 3 처리
        g.changeCalorieDeltaPerDay(delta);

        repo.save(g);

        try {
            Optional<Profile> userProfileOpt = profileRepository.findByUserId(userId);
            if (userProfileOpt.isPresent()) {
                Profile userProfile = userProfileOpt.get();
                BigDecimal newWeight = BigDecimal.valueOf(req.getStartWeightKg());

                // Profile 엔티티에 체중 변경을 위한 메소드가 있다고 가정 (예: updateWeight)
                userProfile.updateWeight(newWeight);

                // @Transactional에 의해 메소드 종료 시 변경 감지(dirty checking)되어 자동으로 DB에 UPDATE 쿼리 실행됨
                log.info("[PlanService] userId={}의 프로필 체중을 {}kg으로 업데이트했습니다.", userId, newWeight);
            } else {
                log.warn("[PlanService] userId={}의 프로필이 존재하지 않아 체중을 업데이트할 수 없습니다.", userId);
            }
        } catch (Exception e) {
            log.error("[PlanService] 프로필 체중 업데이트 중 오류 발생", e);
            // 프로필 업데이트에 실패하더라도 목표 생성 자체는 실패시키지 않도록 예외 처리
        }

        // 저장 직후, 스냅샷도 준비(없으면 insert, 있으면 update)
        upsertMetrics(g, tdeeNullable, sexNullable, req.getMealsPerDay());

        return g.getId();
    }

    // 기존 시그니처도 유지(호환): tdee/sex는 모를 수 있음
    @Transactional
    public Long save(Long userId, SavePlanRequest req) {
        return save(userId, req, null, null);
    }

    @Transactional(readOnly = true)
    public Goal get(Long goalId, Long userId) {
        if (userId == null) {
            // 인증 미연결(또는 공개 조회)일 때는 goalId로만 조회
            return repo.findById(goalId)
                    .orElseThrow(() -> new IllegalArgumentException("goal not found"));
        }
        return repo.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("goal not found"));
    }

    /**
     * 목표 스냅샷 upsert (저장 또는 갱신)
     */
    @Transactional
    public GoalMetrics upsertMetrics(Goal goal, Integer tdee, String sex, Integer mealsOverride) {
        log.info("[PlanService] upsertMetrics START goalId={}, tdee={}, sex={}, meals={}",
                goal.getId(), tdee, sex, mealsOverride);

        // 0) 기본값/보정 준비
        int weeks = (goal.getDuration() != null) ? goal.getDuration().value() : 0;
        double startKg = (goal.getStartWeightKg() != null) ? goal.getStartWeightKg().doubleValue() : 0d;
        double targetKg = (goal.getTargetWeightKg() != null) ? goal.getTargetWeightKg().doubleValue() : 0d;
        int meals = (mealsOverride != null)
                ? mealsOverride
                : (goal.getMealsPerDay() != null ? goal.getMealsPerDay() : 3);

        // 1) sex 보충: Goal → Profile 순서
        if (sex == null) sex = goal.getSex(); // Goal엔 String("M"/"F")일 가능성
        Profile prof = null;
        if (sex == null || tdee == null) {
            prof = profileRepository.findByUserId(goal.getUserId()).orElse(null);
        }
        if (sex == null && prof != null && prof.getGender() != null) {
            sex = mapGender(prof.getGender()); // GenderType -> "M"/"F"/null
        }

        // 1.5) ✅ 최신 metrics 스냅샷을 찾아서 metricsId 확보 (tdee 비어있으면 보충도 가능)
        // PlanService.upsertMetrics(...) 내부, prof를 얻은 "직후"에 이 블록을 넣고,
        // 아래처럼 메서드/파라미터 이름을 교체한다.
        Long metricsId = null;
        if (prof != null) {
            var latest = metricsRepository
                    .findTopByProfile_UserIdOrderByIdDesc(prof.getUserId())  // ✅ 여기!
                    .orElse(null);
            if (latest != null) {
                metricsId = latest.getId();
                if (tdee == null && latest.getDailyCalories() != null) {
                    try {
                        tdee = latest.getDailyCalories().intValue();
                    } catch (Exception ignore) {
                    }
                }
            }
        }

        // 2) TDEE 보충: 인자가 null이면 Profile 값으로 계산 시도 (네 기존 로직 유지)
        // 2) TDEE 보충: MetricsService와 동일 정책 사용
        if (tdee == null && prof != null) {
            // 2-1) 가장 최신 metrics 스냅샷이 있으면 그 값을 우선 사용 (위 1.5에서 latest로 가져온 것)
            //      위에서 latest로 tdee 채웠을 가능성이 있으므로 여기선 없을 때만 다시 계산
            if (tdee == null) {
                // 프로필 값이 충분하면 BMR -> (1 + 활동비) -> × 1.10 으로 계산
                if (prof.getHeight() != null && prof.getWeight() != null && prof.getAge() > 0 && prof.getGender() != null) {
                    tdee = calcTdeeLikeMetrics(prof);
                }
            }
        }

        // 3) 원시/적용 델타 계산
        int raw = calc.calcDailyDelta(startKg, targetKg, weeks);
        int applied = calc.clampByPlanLimit(goal.getType(), raw, tdee);

        // 4) 타깃 칼로리/끼니당 계산 (tdee가 있어야 산출됨)
        Integer targetDaily = (tdee != null) ? (tdee + applied) : null;
        if (targetDaily != null) {
            targetDaily = calc.applyFloor(targetDaily, sex); // 성별별 최소치 바닥 적용
        }
        Integer perMeal = calc.perMeal(targetDaily, meals);

        // 5) 탄단지 비율
        var ratio = calc.ratioFor(goal.getType()); // {"carb":40,"protein":35,"fat":25} 등

        // 6) upsert
        GoalMetrics m = metricsRepo.findByGoalId(goal.getId()).orElse(new GoalMetrics(goal));
        m.setTdeeBaseline(tdee);
        m.setSex(sex);
        m.setDailyDeltaRaw(raw);
        m.setDailyDeltaApplied(applied);
        m.setTargetDailyKcal(targetDaily);
        m.setPerMealKcal(perMeal);
        m.setRatioCarb(ratio.get("carb"));
        m.setRatioProt(ratio.get("protein"));
        m.setRatioFat(ratio.get("fat"));
        m.setMealsPerDay(meals);
        m.setMetricsId(metricsId); // ✅ 여기서 저장

        GoalMetrics saved = metricsRepo.save(m);
        log.info("[PlanService] upsertMetrics DONE metricsId={}, goalId={}, tdee={}, sex={}, targetDaily={}, perMeal={}, baseMetricsId={}",
                saved.getId(), goal.getId(), tdee, sex, targetDaily, perMeal, metricsId);
        return saved;
    }

    /**
     * GenderType -> "M"/"F"/null 로 변환
     */
    private String mapGender(GenderType g) {
        if (g == null) return null;
        return switch (g) {
            case MALE -> "M";
            case FEMALE -> "F";
            default -> null; // NOTTHING 등 기타 값은 null
        };
    }
    /** MetricsService와 동일한 방식으로 TDEE 계산 */
    private Integer calcTdeeLikeMetrics(Profile prof) {
        var bmr = calculateBMRLikeMetrics(prof.getWeight(), prof.getHeight(), prof.getAge(), prof.getGender());
        var factor = BigDecimal.valueOf(1.0 + activityPercent(prof.getActivityLevel()));
        return bmr.multiply(factor)
                .multiply(BigDecimal.valueOf(1.10)) // TEF 10% 포함(현재 MetricsService 정책)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    /** MetricsService.calculateBMR와 동일 */
    private BigDecimal calculateBMRLikeMetrics(BigDecimal weightKg, BigDecimal heightCm, int age, GenderType gender) {
        BigDecimal result = BigDecimal.valueOf(10).multiply(weightKg)
                .add(BigDecimal.valueOf(6.25).multiply(heightCm))
                .subtract(BigDecimal.valueOf(5).multiply(BigDecimal.valueOf(age)));
        if (gender == GenderType.MALE) {
            result = result.add(BigDecimal.valueOf(5));
        } else {
            result = result.subtract(BigDecimal.valueOf(161));
        }
        return result.setScale(2, RoundingMode.HALF_UP);
    }

    /** MetricsService.getActivityMultiplier와 동일(퍼센트값) */
    private double activityPercent(int level) {
        return switch (level) {
            case 1 -> 0.2; // 좌식
            case 2 -> 0.3; // 가벼운 활동
            case 3 -> 0.5; // 중등도
            case 4 -> 0.7; // 활동적
            default -> 0.2;
        };
    }
}