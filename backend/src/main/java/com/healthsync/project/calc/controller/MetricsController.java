package com.healthsync.project.calc.controller;

import com.healthsync.project.calc.dto.CalcProfileRequest;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.service.CalcProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/calc")
public class MetricsController {

    private final CalcProfileService userMockService;

    // BMI 계산용 POST 엔드포인트
    @PostMapping("/bmi")
    public ResponseEntity<?> BMI(@RequestBody CalcProfileRequest request) {
        try {
            MetricsResponse result = userMockService.createUserAndCalcBMI(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}