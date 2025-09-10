package com.healthsync.project.calc.controller;

import com.healthsync.project.calc.domain.CalcProfile;
import com.healthsync.project.calc.dto.CalcProfileRequest;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.service.CalcProfileService;
import com.healthsync.project.calc.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/calc")
public class MetricsController {

    private final CalcProfileService calcProfileService;
    private final MetricsService metricsService;

    // Profile Entity 저장용 POST 엔드포인트
    @PostMapping("/profile")
    public ResponseEntity<?> CalcProfile(@RequestBody CalcProfileRequest request) {
        try {
            CalcProfile profile = calcProfileService.createAndSaveCalcProfile(request);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // BMI 계산 및 Metrics Entity 저장용 POST 엔드포인트
    @PostMapping("/bmi")
    public ResponseEntity<?> BMI(@RequestBody CalcProfileRequest request) {
        try {
            // 저장된 프로필 기반으로 BMI 계산
            MetricsResponse result = metricsService.calculateAndSaveBMI(request.getEmail()); // Email 기반 조회
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("BMI 계산 중 오류: " + e.getMessage());
        }
    }
}