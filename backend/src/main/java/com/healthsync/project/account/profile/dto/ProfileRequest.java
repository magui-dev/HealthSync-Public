package com.healthsync.project.account.profile.dto;

import com.healthsync.project.account.profile.constant.GenderType;
//import com.healthsync.project.goal.domain.Goal_type;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProfileRequest {
    private int age;
    private GenderType gender;
    private BigDecimal height;
    private BigDecimal weight;
    private int activityLevel;
}