package com.healthsync.project.plan.dto;

import lombok.Data;

/**
 * 목표 저장 요청 바디
 * 프론트 PlanSetup에서 보내는 필드와 이름을 정확히 맞춤.
 */
@Data
public class SavePlanRequest {
    private String type;            // "LEAN" | "HEALTH"
    private String startDate;       // "YYYY-MM-DD"
    private int weeks;              // 기간(주)
    private double startWeightKg;   // 시작 체중(kg)
    private double targetWeightKg;  // 목표 체중(kg)
    private Integer mealsPerDay;    // (옵션) 2/3/4, null이면 서버에서 3 처리
}
