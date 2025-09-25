package com.healthsync.project.plan.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 목표 한 건에 대한 "계산된 결과 스냅샷" (권장 섭취 등)
 * Goal : GoalMetrics = 1 : 1
 */
@Entity
@Table(
        name = "goal_metrics",
        uniqueConstraints = @UniqueConstraint(name = "uk_goal_metrics_goal", columnNames = "goal_id")
)
@Getter @Setter
@NoArgsConstructor
public class GoalMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 목표 1:1 */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    // ⬇️ 추가: metrics 테이블의 PK를 그대로 저장(실제 FK 제약 없이 숫자만)
    @Column(name = "metrics_id")
    private Long metricsId;

    // 입력(스냅샷 시점 정보)
    @Column(name = "tdee_baseline")
    private Integer tdeeBaseline;     // 스냅샷 당시 기준 TDEE

    @Column(name = "sex", length = 1) // "M" | "F" | null
    private String sex;

    @Column(name = "meals_per_day")
    private Integer mealsPerDay;      // 끼니 수 스냅샷

    // 계산 결과
    @Column(name = "daily_delta_raw")
    private Integer dailyDeltaRaw;        // 목표 기반 원래 ±kcal/일

    @Column(name = "daily_delta_applied")
    private Integer dailyDeltaApplied;    // 플랜 한도/하한 적용 후 ±kcal/일

    @Column(name = "target_daily_kcal")
    private Integer targetDailyKcal;      // 최종 권장 kcal/일

    @Column(name = "per_meal_kcal")
    private Integer perMealKcal;          // 끼니 kcal

    // 비율(보여주기 편하도록 저장)
    @Column(name = "ratio_carb")
    private Integer ratioCarb;

    @Column(name = "ratio_prot")
    private Integer ratioProt;

    @Column(name = "ratio_fat")
    private Integer ratioFat;

    // 타임스탬프
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public GoalMetrics(Goal goal) {
        this.goal = goal;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
