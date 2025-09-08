package com.healthsync.project.calc.service;

import com.healthsync.project.calc.dto.CalcResult;
import com.healthsync.project.calc.dto.TestUser;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CalcService {

    /**
     * BMI 계산 및 체중 분류, 표준체중, 하루 칼로리 계산
     * @param user TestUser 엔티티
     * @return BMIResult
     */
    public CalcResult calculateBMIForUser(TestUser user) {
        double heightM = user.getHeight() / 100; // cm → m
        double weightKg = user.getWeight();
        String gender = user.getGender();
        int age = Period.between(user.getBirth(), LocalDate.now()).getYears();

        // 1. BMI 계산
        double bmi = getPointFromTwo(weightKg / (heightM * heightM));
        String category = getBMICategory(bmi);

        // 2. 표준체중 계산
        double standardWeight = gender.equalsIgnoreCase("male") ?
                getPointFromTwo(heightM * heightM * 22) :
                getPointFromTwo(heightM * heightM * 21);

        // 3. 기초대사량(BMR) 계산 (미프린-세인트 조르 공식 사용)
        double bmr = getPointFromTwo(calculateBMR(weightKg, user.getHeight(), age, gender));

        // 4. 활동대사량
        int activityLevel = user.getLevel();
        double activityMultiplier = getActivityMultiplier(activityLevel);
        double activityCalories = getPointFromTwo(bmr * activityMultiplier);

        // 5. 하루 총 소화대사량
        double dailyCalories;
        if (bmi <= 22.9) { // 표준체중 범위
            dailyCalories = standardWeight * 32; // 평균 30~35 kcal
        } else { // 비만 조정
            double adjustedWeight = standardWeight + (weightKg - standardWeight) / 4;
            dailyCalories = adjustedWeight * 27.5; // 평균 25~30 kcal
        }

        // 소화대사량 포함
        dailyCalories += (bmr + activityCalories) * 0.1;
        dailyCalories = getPointFromTwo(dailyCalories);

        return new CalcResult(bmi, category, standardWeight, dailyCalories, bmr, activityCalories);
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
    private double getPointFromTwo(double result){
        BigDecimal bd = new BigDecimal(result);
        bd = bd.setScale(2, RoundingMode.HALF_UP); // 소수 둘째자리 반올림
        return bd.doubleValue();
    };
}