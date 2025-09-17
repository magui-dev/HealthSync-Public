package com.healthsync.project.plan.service;


import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.dto.PlanSummaryDto;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanSummaryService {
    private final GoalRepository goals;

    @Transactional(readOnly = true)
    public PlanSummaryDto summary(Long userId, Long goalId) {
        Goal g = goals.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException(" 목표가 없습니다. :" + goalId));
        if (!g.getUserId().equals(userId)) throw new IllegalArgumentException("목표를 찾을 수 없습니다.");

        //그래프 주차별 선형 예측,프로필 없이도 계산가능
        List<PlanSummaryDto.ForecastPoint> forecast = buildForecast(
                g.getStartWeightKg().doubleValue(),
                g.getTargetWeightKg().doubleValue(),
                g.getDuration().value()
        );

        //프로필/활동지수 미연동 : 당장 그래프만
        // 프로필 붙으면 아래계산 자동블록 활성화
        Integer tdee = null, dailyKcal = null, perMealKcal = null;
        int mealsPerDay = 3;  /** mealsPerDay = 3 : 기본 끼니 수는 3으로 설정(나중에 바꿀 여지). */
        PlanSummaryDto.MacroRatio ratio = new PlanSummaryDto.MacroRatio(50, 30, 20);  /** 탄단지 비율 */
        PlanSummaryDto.MacroGrams daily = null, perMeal = null;

        return new PlanSummaryDto(false, List.of("sex", "age", "heightCm", "activityLevel"),
                tdee, dailyKcal, mealsPerDay, perMealKcal, ratio, daily, perMeal, forecast);
    }

    /**
     * 그래프 생성로직 [ {week:1, expectedWeightKg:...}, ..., {week:N, ...} ] 배열을 반환 → 프론트 라인차트에 바로 꽂을 수 있음
     */
    private static List<PlanSummaryDto.ForecastPoint> buildForecast(double s, double t, int weeks){
        List<PlanSummaryDto.ForecastPoint> list = new ArrayList<>();
        for(int w=1; w<=weeks; w++){
            double kg = s + (t - s) * (w/(double)weeks);
            list.add(new PlanSummaryDto.ForecastPoint(w, Math.round(kg*10.0)/10.0));
        }
        return list;
    }
}
