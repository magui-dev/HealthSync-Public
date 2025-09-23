package com.healthsync.project.account.profile.dto;

import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.domain.Profile;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// 정보 조회용 Response.0922추가
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long userId;
    private int age;
    private GenderType gender;
    private BigDecimal height;
    private BigDecimal weight;
    private int activityLevel;
    private String nickname; // User 엔티티에서 가져올 닉네임 추가
    // bmi,bmr 정보 필요시
//    private BigDecimal bmi;
//    private double basalMetabolism;

}
