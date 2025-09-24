package com.healthsync.project.calc.service;

import com.healthsync.project.account.profile.constant.GenderType;
import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.calc.domain.Metrics;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.repository.MetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class MetricsService {

    private final ProfileRepository profileRepository;
    private final MetricsRepository metricsRepository;

    /**
     * 프로필을 기반으로 BMI 계산 및 Metrics 저장
     *
     * @param userId Long
     * @return MetricsResponse
     */
    public MetricsResponse calculateAndSaveBMI(Long userId) {
        // 1. Profile 조회
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("해당 유저를 찾을 수 없습니다"));

        // 2. 기본 정보 세팅
        BigDecimal heightM = profile.getHeight().divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP); // cm → m
        BigDecimal weightKg = profile.getWeight();
        int age = profile.getAge();
        GenderType gender = profile.getGender();
        int activityLevel = profile.getActivityLevel();

        // 3. BMI 계산 (weightKg / (heightM * heightM)
        BigDecimal bmi = weightKg.divide(heightM.multiply(heightM), 2, RoundingMode.HALF_UP);
        String category = getBMICategory(bmi);

        // 4. 표준체중 계산
        BigDecimal standardWeight = (gender == GenderType.MALE) ?
                // (heightM * heightM * 22) : (heightM * heightM * 21)
                heightM.multiply(heightM).multiply(BigDecimal.valueOf(22)).setScale(2, RoundingMode.HALF_UP)
                :
                heightM.multiply(heightM).multiply(BigDecimal.valueOf(21)).setScale(2, RoundingMode.HALF_UP);

        // 5. 기초대사량(BMR) 계산 (미프린-세인트 조르 공식 사용)
        BigDecimal bmr = calculateBMR(weightKg, profile.getHeight(), age, gender);
        // 6. 활동대사량 계산
        BigDecimal activityCalories = bmr.multiply(BigDecimal.valueOf(getActivityMultiplier(activityLevel))).setScale(2, RoundingMode.HALF_UP);

        // 7. 하루 총 소화대사량 계산
        BigDecimal dailyCalories;
        if (bmi.compareTo(BigDecimal.valueOf(22.9)) <= 0) {
            dailyCalories = standardWeight.multiply(BigDecimal.valueOf(32)); // 평균 30~35 kcal
        } else { // 비만 조정
            BigDecimal adjustedWeight = standardWeight.add(weightKg.subtract(standardWeight).divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP));
            dailyCalories = adjustedWeight.multiply(BigDecimal.valueOf(27.5)); // 평균 25~30 kcal
        }
        // 소화대사량 포함
        dailyCalories = dailyCalories.add(bmr.add(activityCalories).multiply(BigDecimal.valueOf(0.1))).setScale(2, RoundingMode.HALF_UP);

        // 8. Metrics 엔티티 생성 및 DB 저장
        Metrics metrics = Metrics.builder()
                .bmi(bmi)
                .category(category)
                .standardWeight(standardWeight)
                .bmr(bmr)
                .activityCalories(activityCalories)
                .dailyCalories(dailyCalories)
                .profile(profile)
                .build();

        profile.getMetricsList().add(metrics);

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

    /** BMI 분류 */
    private String getBMICategory(BigDecimal bmi) {
        if (bmi.compareTo(BigDecimal.valueOf(18.5)) < 0) return "저체중";
        if (bmi.compareTo(BigDecimal.valueOf(22.9)) <= 0) return "정상";
        if (bmi.compareTo(BigDecimal.valueOf(24.9)) <= 0) return "비만전단계";
        if (bmi.compareTo(BigDecimal.valueOf(29.9)) <= 0) return "1단계 비만";
        if (bmi.compareTo(BigDecimal.valueOf(34.9)) <= 0) return "2단계 비만";
        return "3단계 비만";
    }

    /**
      BMR 계산 (미프린-세인트 조르 공식).0922 public 수정
     */
    public BigDecimal calculateBMR(BigDecimal weightKg, BigDecimal heightCm, int age, GenderType gender) {
        // (10 * weightKg + 6.25 * heightCm - 5 * age + 5) : (10 * weightKg + 6.25 * heightCm - 5 * age - 161)
        BigDecimal result = BigDecimal.valueOf(10).multiply(weightKg)
                .add(BigDecimal.valueOf(6.25).multiply(heightCm))
                .subtract(BigDecimal.valueOf(5).multiply(BigDecimal.valueOf(age)));

        if (gender == GenderType.MALE) {
            result = result.add(BigDecimal.valueOf(5));
        } else {
            result = result.subtract(BigDecimal.valueOf(161));
        }

        return result.setScale(2, RoundingMode.HALF_UP);
    }

    /** 활동대사량 계수 */
    private double getActivityMultiplier(int level) {
        return switch (level) {
            case 1 -> 0.2;
            case 2 -> 0.3;
            case 3 -> 0.5;
            case 4 -> 0.7;
            default -> 0.2; // 기본 사무직
        };
    }
}