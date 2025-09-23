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



}