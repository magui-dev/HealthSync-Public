package com.healthsync.project.account.profile.domain;

import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.calc.domain.Metrics;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "profile")
public class Profile {

    /** User와 1:1, PK + FK */
    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId   // userId를 PK이자 FK로 사용
    @JoinColumn(name = "user_id")
    private User user;

    private int age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GenderType gender;

    @Column(nullable = false, precision = 4, scale = 1)
    @DecimalMin(value = "100.0", message = "키는 100cm 이상이어야 합니다.")
    @DecimalMax(value = "250.0", message = "키는 250cm 이하여야 합니다.")
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    /** 활동 레벨 */
    @Column(name = "activity_level", nullable = false)
    @Min(value = 1, message = "활동 레벨은 1 이상이어야 합니다.")
    @Max(value = 4, message = "활동 레벨은 4 이하여야 합니다.")
    private int activityLevel;

    /** 프로필 image */
    private String profileImageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Metrics와 1:N 관계 */
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Metrics> metricsList = new ArrayList<>();

    // ===== 생성 및 업데이트 =====
    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

    static public Profile createInitProfileSetting() {
        Profile profile = new Profile();
        profile.setAge(0);
        profile.setHeight(BigDecimal.valueOf(250.0));
        profile.setGender(GenderType.NOTTHING);
        profile.setActivityLevel(1);
        return profile;
    }

    public void updateProfile(ProfileRequest profileRequest) {
        this.age = profileRequest.getAge();
        this.gender = profileRequest.getGender();
        this.height = profileRequest.getHeight();
        this.weight = profileRequest.getWeight();
        this.activityLevel = profileRequest.getActivityLevel();
        this.profileImageUrl = profileRequest.getProfileImageUrl();
        touchUpdatedAt();
    }
}
