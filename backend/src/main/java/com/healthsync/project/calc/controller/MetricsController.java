package com.healthsync.project.calc.controller;

import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/calc")
public class MetricsController {

    private final MetricsService metricsService;

    // BMI 계산 및 Metrics Entity 저장용 POST 엔드포인트
    @PostMapping("/bmi")
    public ResponseEntity<?> BMI(@RequestParam Long userId) {
        try {
            // profile 기반 BMI 계산
            MetricsResponse result = metricsService.calculateAndSaveBMI(userId);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("BMI 계산 중 오류: " + e.getMessage());
        }
    }

    // ✅ [추가] 사용자의 최신 Metrics를 조회하는 GET 엔드포인트
    @GetMapping("/{userId}/latest")
    public ResponseEntity<?> getLatestMetrics(@PathVariable Long userId) {
        try {
            MetricsResponse latestMetrics = metricsService.getLatestMetricsByUserId(userId);
            return ResponseEntity.ok(latestMetrics);
        } catch (NoSuchElementException e) {
            // 서비스에서 던진 예외를 받아 404 상태 코드와 메시지를 반환합니다.
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // 그 외의 예외 처리
            return ResponseEntity.badRequest().body("최신 데이터 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }



}