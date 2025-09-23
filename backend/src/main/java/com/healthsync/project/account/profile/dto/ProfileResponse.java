package com.healthsync.project.account.profile.dto;

import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.domain.Profile;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private int age;
    private GenderType gender;
    private BigDecimal height;
    private BigDecimal weight;
    private int activityLevel;
    private LocalDateTime updateAt;
    private String profileImageUrl;

    /** 프로필 불러오기 */
    public static ProfileResponse createProfileResponse(Profile profile) {
        return ProfileResponse.builder()
                .age(profile.getAge())
                .gender(profile.getGender())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .activityLevel(profile.getActivityLevel())
                .updateAt(profile.getUpdatedAt())
                .profileImageUrl(profile.getProfileImageUrl())
                .build();
    }

}
