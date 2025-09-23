package com.healthsync.project.plan.service;

import com.healthsync.project.account.profile.history.WeightLog;
import com.healthsync.project.account.profile.history.WeightLogRepository;
import com.healthsync.project.plan.domain.Goal;
import com.healthsync.project.plan.dto.ProgressDto;
import com.healthsync.project.plan.dto.WeighInDto;
import com.healthsync.project.plan.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {
    private final GoalRepository goals;
    private final WeightLogRepository logs;

    @Transactional
    public WeighInDto add(Long userId, Long goalId, BigDecimal weight, LocalDateTime when) {
        Goal g = goals.findById(goalId).orElseThrow();
        if (!g.getUserId().equals(userId)) throw new IllegalArgumentException("권한 없음");
        WeightLog w = logs.save(WeightLog.builder()
                .userId(userId)
                .weight(weight)
                .recordedAt(when == null ? null : when)
                .build());
        return new WeighInDto(w.getId(), goalId, w.getWeight(), w.getRecordedAt());
    }

    @Transactional(readOnly = true)
    public List<WeighInDto> list(Long userId, Long goalId) {
        Goal g = goals.findById(goalId).orElseThrow();
        if (!g.getUserId().equals(userId)) throw new IllegalArgumentException("권한 없음");
        LocalDate start = g.getStartDate();
        LocalDate end = start.plusWeeks(g.getDuration().value());
        var rows = logs.findAllByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                userId, start.atStartOfDay(), end.atTime(23,59,59));
        return rows.stream().map(w -> new WeighInDto(w.getId(), goalId, w.getWeight(), w.getRecordedAt())).toList();
    }

    @Transactional(readOnly = true)
    public ProgressDto progress(Long userId, Long goalId) {
        Goal g = goals.findById(goalId).orElseThrow();
        if (!g.getUserId().equals(userId)) throw new IllegalArgumentException("권한 없음");

        // 1) 예측선(기존 summary와 동일한 선형 보간)
        List<ProgressDto.Point> forecast = new ArrayList<>();
        for (int w = 1; w <= g.getDuration().value(); w++) {
            double kg = g.getStartWeightKg().doubleValue()
                    + (g.getTargetWeightKg().doubleValue() - g.getStartWeightKg().doubleValue())
                    * (w / (double) g.getDuration().value());
            forecast.add(new ProgressDto.Point(w, Math.round(kg * 10.0) / 10.0));
        }

        // 2) 실제선(목표 기간 내의 체중 로그를 주차로 환산)
        LocalDate start = g.getStartDate();
        LocalDate end = start.plusWeeks(g.getDuration().value());
        var rows = logs.findAllByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                userId, start.atStartOfDay(), end.atTime(23,59,59));

        List<ProgressDto.Point> actual = new ArrayList<>();
        for (var w : rows) {
            int week = (int)Math.max(1, ChronoUnit.WEEKS.between(start, w.getRecordedAt().toLocalDate()) + 1);
            actual.add(new ProgressDto.Point(week, w.getWeight().doubleValue()));
        }

        // 3) 진행률(시작→최근 / 시작→목표)
        double latest = rows.isEmpty() ? g.getStartWeightKg().doubleValue()
                : rows.get(rows.size()-1).getWeight().doubleValue();
        double targetDelta = g.getStartWeightKg().doubleValue() - g.getTargetWeightKg().doubleValue();
        double actualDelta = g.getStartWeightKg().doubleValue() - latest;
        double percent = targetDelta <= 0 ? 0 : Math.max(0, Math.min(1, actualDelta / targetDelta));

        return new ProgressDto(forecast, actual, Math.round(percent * 1000) / 10.0);
    }
}
