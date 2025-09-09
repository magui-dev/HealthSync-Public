package com.healthsync.project.calc.service;

import com.healthsync.project.calc.domain.Metrics;
import com.healthsync.project.calc.domain.CalcProfile;
import com.healthsync.project.calc.dto.CalcProfileRequest;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.repository.MetricsRepository;
import com.healthsync.project.calc.repository.CalcProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CalcProfileService {

    private final CalcProfileRepository ProfileRepository;
    private final MetricsRepository MetricsRepository;
    private final MetricsService calcService;

    /**
     * Postman body로 들어온 DTO(CalcProfileRequest) → Entity 저장 → BMI 계산 → CalcResultEntity 저장 → DTO 반환
     */
    public MetricsResponse createUserAndCalcBMI(CalcProfileRequest request) {
        // DTO → Entity 변환
        CalcProfile ProfileEntity = CalcProfile.builder()
                .name(request.getName())
                .birth(request.getBirth())
                .height(request.getHeight())
                .weight(request.getWeight())
                .gender(request.getGender())
                .level(request.getLevel())
                .build();
        ProfileEntity = ProfileRepository.save(ProfileEntity);

        // BMI 계산
        MetricsResponse result = calcService.calculateBMI(request);

        // CalcResultEntity로 변환 후 저장
        Metrics calcEntity = Metrics.builder()
                .bmi(result.getBmi())
                .category(result.getCategory())
                .standardWeight(result.getStandardWeight())
                .dailyCalories(result.getDailyCalories())
                .bmr(result.getBmr())
                .activityCalories(result.getActivityCalories())
                .profile(ProfileEntity)
                .build();
        MetricsRepository.save(calcEntity);

        return result;
    }
}