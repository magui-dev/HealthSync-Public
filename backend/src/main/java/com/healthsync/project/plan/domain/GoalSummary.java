package com.healthsync.project.plan.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "hs_goal_summary")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalSummary {

    @Id
    @Column(name = "goal_id")
    private Long goalId; // Goal과 1:1 (PK 공유)

    // 기준/결과 칼로리
    private Integer tdee;
    @Column(name = "delta_raw")     private int deltaRaw;
    @Column(name = "delta_applied") private int deltaApplied;

    @Column(name = "target_daily_kcal") private Integer targetDailyKcal; // 권장/일
    @Column(name = "per_meal_kcal")     private Integer perMealKcal;     // 권장/끼니
    @Column(name = "meals_per_day")     private int mealsPerDay;

    // 매크로 g & 비율
    @Column(name = "macro_carb_g_day")  private Integer macroCarbGDay;
    @Column(name = "macro_prot_g_day")  private Integer macroProtGDay;
    @Column(name = "macro_fat_g_day")   private Integer macroFatGDay;

    @Column(name = "macro_carb_g_meal") private Integer macroCarbGMeal;
    @Column(name = "macro_prot_g_meal") private Integer macroProtGMeal;
    @Column(name = "macro_fat_g_meal")  private Integer macroFatGMeal;

    @Column(name = "macro_carb_pct")    private int macroCarbPct;
    @Column(name = "macro_prot_pct")    private int macroProtPct;
    @Column(name = "macro_fat_pct")     private int macroFatPct;

    @Column(name = "warnings_text", length = 4000)
    private String warningsText;

    // 타임스탬프 (스키마 자동)
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }
    @PreUpdate
    public void onUpdate() {
        updatedAt = Instant.now();
    }
}
