package com.healthsync.project.calc.controller;

import com.healthsync.project.calc.dto.CalcResult;
import com.healthsync.project.calc.dto.TestUser;
import com.healthsync.project.calc.service.CalcService;
import com.healthsync.project.calc.service.UserMockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/calc")
public class TestController {

    private final UserMockService userMockService;
    private final CalcService bmiService;

    // User
    @GetMapping("/Testbmiuser")
    public ResponseEntity<?> getTestUser() {
        try{
            List<TestUser> result =  userMockService.getAllUsers();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // BMI
    @GetMapping("/bmi")
    public ResponseEntity<?> getBMI() {
        try{
            List<TestUser> users = userMockService.getAllUsers();
            List<CalcResult> result = users.stream()
                    .map(bmiService::calculateBMIForUser) // user -> bmiService.calculateBMIForUser(user)
                    .toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
}
