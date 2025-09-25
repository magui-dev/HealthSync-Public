package com.healthsync.project.plan.dto;

import lombok.Data;

/** 목표 스냅샷 생성/갱신 요청 */
@Data
public class CreateMetricsRequest {
    private Integer tdee;   // /calc/bmi 로 얻은 TDEE
    private String  sex;    // "M" | "F"
    private Integer mealsPerDay; // (옵션) UI에서 바꿨다면 같이 저장
}
