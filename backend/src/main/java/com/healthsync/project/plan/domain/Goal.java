package com.healthsync.project.plan.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 목표 entity
 * fk = users.id
 */

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "goals", indexes = {
        @Index(name = "ix_goals_user", columnList = "user_id"),
        @Index(name = "ix_goals_start", columnList = "start_date")
})
public class Goal {

    /**
     * @Id: PK, @GeneratedValue:자동증가)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GoalType type; //lean,health

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** 목표기간(주) - 값타입(weeks int 1개로 저장) */
    @Embedded
    private PlanDuration duration;

    /** 시작 /목표 체중 */
    @Column(name = "start_weight_kg", nullable = false, precision = 5, scale = 2)
    private BigDecimal startWeightKg;

    @Column(name = "target_weight_kg", nullable = false, precision = 5, scale = 2)
    private BigDecimal targetWeightKg;

    /** 타임스탬프 */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    //--생성자(팩토리)--
    public Goal(Long userId,
                GoalType type,
                LocalDate startDate,
                PlanDuration duration,
                BigDecimal startWeightKg,
                BigDecimal targetWeightKg) {
        this.userId = userId;
        this.type = type;
        this.startDate = startDate;
        this.duration = duration;
        this.startWeightKg = startWeightKg;
        this.targetWeightKg = targetWeightKg;
    }

    // -- 라이프사이클 콜백 --

    @PrePersist
    void prePersist() {
        computeEndDate();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        computeEndDate();
        updatedAt = LocalDateTime.now();
    }

    /** 종료일 자동 계산 (마지막날짜 포함) */
    private void computeEndDate() {
        if (this.startDate != null && this.duration != null) {
            this.endDate = this.startDate.plusWeeks(this.duration.value()).minusDays(1);
        }
    }

    public void overwriteSameSlot(GoalType type, BigDecimal startWeightKg, BigDecimal targetWeightKg) {
        this.type = type;
        this.startWeightKg = startWeightKg;
        this.targetWeightKg = targetWeightKg;
    }

    //--변경 메서드
    public void changeStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void changeDuration(PlanDuration duration) {
        this.duration = duration;
    }

}
