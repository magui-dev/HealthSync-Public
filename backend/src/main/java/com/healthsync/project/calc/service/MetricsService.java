package com.healthsync.project.calc.service;

import com.healthsync.project.calc.domain.CalcProfile;
import com.healthsync.project.calc.domain.Metrics;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.repository.CalcProfileRepository;
import com.healthsync.project.calc.repository.MetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final CalcProfileRepository calcProfileRepository;
    private final MetricsRepository metricsRepository;

    /**
     * 기존 프로필을 기반으로 BMI 계산 및 Metrics 저장
     *
     * @param userEmail String
     * @return MetricsResponse
     */
    public MetricsResponse calculateAndSaveBMI(String userEmail) {
        // 1. Email로 유저 프로필 조회
        CalcProfile calcprofile = calcProfileRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("해당 유저를 찾을 수 없습니다. userId=" + userEmail));

        // 2. 기본 정보 세팅
        double heightM = calcprofile.getHeight() / 100; // cm → m
        double weightKg = calcprofile.getWeight();
        String gender = calcprofile.getGender();
        int age = Period.between(calcprofile.getBirth(), LocalDate.now()).getYears();

        // 3. BMI 계산
        double bmi = round2(weightKg / (heightM * heightM));
        String category = getBMICategory(bmi);

        // 4. 표준체중 계산
        double standardWeight = gender.equalsIgnoreCase("male") ?
                round2(heightM * heightM * 22) :
                round2(heightM * heightM * 21);

        // 5. 기초대사량(BMR) 계산 (미프린-세인트 조르 공식 사용)
        double bmr = round2(calculateBMR(weightKg, calcprofile.getHeight(), age, gender));

        // 6. 활동대사량 계산
        double activityCalories = round2(bmr * getActivityMultiplier(calcprofile.getLevel()));

        // 7. 하루 총 소화대사량 계산
        double dailyCalories;
        if (bmi <= 22.9) { // 표준체중 범위
            dailyCalories = standardWeight * 32; // 평균 30~35 kcal
        } else { // 비만 조정
            double adjustedWeight = standardWeight + (weightKg - standardWeight) / 4;
            dailyCalories = adjustedWeight * 27.5; // 평균 25~30 kcal
        }
        // 소화대사량 포함
        dailyCalories += (bmr + activityCalories) * 0.1;
        dailyCalories = round2(dailyCalories);

        // 8. Metrics 엔티티 생성 및 DB 저장
        Metrics metrics = Metrics.builder()
                .bmi(bmi)
                .category(category)
                .standardWeight(standardWeight)
                .bmr(bmr)
                .activityCalories(activityCalories)
                .dailyCalories(dailyCalories)
                .profile(calcprofile) // profile 참조(FK)
                .build();
        metricsRepository.save(metrics);

        // 9. DTO 반환
        return MetricsResponse.builder()
                .bmi(bmi)
                .category(category)
                .standardWeight(standardWeight)
                .bmr(bmr)
                .activityCalories(activityCalories)
                .dailyCalories(dailyCalories)
                .build();
    }

    // BMI 분류
    private String getBMICategory(double bmi) {
        if (bmi <= 18.5) return "저체중";
        if (bmi <= 22.9) return "정상범위";
        if (bmi <= 24.9) return "과체중";
        if (bmi <= 29) return "1단계 비만";
        return "2단계 비만";
    }

    // 미프린-세인트 조르 공식
    private double calculateBMR(double weightKg, double heightCm, int age, String gender) {
        if (gender.equalsIgnoreCase("남자")) {
            return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
            return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }
    }

    // 활동대사량 곱셈 계수
    private double getActivityMultiplier(int level) {
        return switch (level) {
            case 1 -> 0.2;
            case 2 -> 0.3;
            case 3 -> 0.5;
            case 4 -> 0.7;
            default -> 0.2; // 기본 사무직
        };
    }

    // 소수점 둘째짜리까지 (반올림)
    private double round2(double value){
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    };
}