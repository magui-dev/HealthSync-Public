package com.healthsync.project.plan.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * goal × category(탄/단/지) 1개를 '스냅샷'으로 저장.
 * - Nutri 응답을 그대로 보존(그때 kcal/탄단지 값이 남음)
 * - (goal_id, category) 유니크 → 카테고리당 1개만 유지
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "food_selections",
        uniqueConstraints = @UniqueConstraint(columnNames = {"goal_id","category"}),
        indexes = {
                @Index(name = "ix_foodsel_goal", columnList = "goal_id"),
                @Index(name = "ix_foodsel_user", columnList = "user_id")
        })
public class FoodSelection {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable=false)  private Long userId;
    @Column(name="goal_id", nullable=false)  private Long goalId;

    @Enumerated(EnumType.STRING)
    @Column(name="category", nullable=false, length=16)
    private MacroCategory category;

    @Column(nullable=false, length=200) private String label; // 예: "쌀밥 200g"
    @Column(name="serving_g")           private Double servingG; // g 단위(없을 수 있음)
    @Column(nullable=false)             private Integer kcal;
    @Column(name="carbs_g",   nullable=false)  private Double carbsG;
    @Column(name="protein_g", nullable=false)  private Double proteinG;
    @Column(name="fat_g",     nullable=false)  private Double fatG;

    @Column(nullable=false, length=50)  private String source;     // "NUTRI_API"|"CUSTOM"
    @Column(name="external_id", length=100) private String externalId;

    @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at", nullable=false)                  private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate  void preUpdate(){  updatedAt = LocalDateTime.now(); }

    @Builder
    public FoodSelection(Long userId, Long goalId, MacroCategory category,
                         String label, Double servingG, Integer kcal,
                         Double carbsG, Double proteinG, Double fatG,
                         String source, String externalId) {
        this.userId = userId; this.goalId = goalId; this.category = category;
        this.label = label; this.servingG = servingG; this.kcal = kcal;
        this.carbsG = carbsG; this.proteinG = proteinG; this.fatG = fatG;
        this.source = source; this.externalId = externalId;
    }

    /** 같은 카테고리에 새 항목으로 교체(upsert시 사용) */
    public void replaceWith(String label, Double servingG, Integer kcal,
                            Double carbsG, Double proteinG, Double fatG,
                            String source, String externalId){
        this.label = label; this.servingG = servingG; this.kcal = kcal;
        this.carbsG = carbsG; this.proteinG = proteinG; this.fatG = fatG;
        this.source = source; this.externalId = externalId;
    }
}