package com.healthsync.project.calc.domain;

import com.healthsync.project.account.profile.domain.Profile;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Metrics")
public class Metrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private BigDecimal bmi;               // 계산된 BMI 값
    private String category;              // BMI 분류
    private BigDecimal standardWeight;    // 표준체중
    private BigDecimal dailyCalories;     // 하루 권장 칼로리
    private BigDecimal bmr;               // 기초대사량
    private BigDecimal activityCalories;  // 활동대사량

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private Profile profile;
}