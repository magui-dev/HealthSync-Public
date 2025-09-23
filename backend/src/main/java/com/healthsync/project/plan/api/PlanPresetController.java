package com.healthsync.project.plan.api;

import com.healthsync.project.plan.dto.MacroPresetsDto;
import com.healthsync.project.plan.service.PresetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PlanPresetController {
    private final PresetService service;

    @GetMapping("/api/plan/presets")
    public ResponseEntity<MacroPresetsDto> presets(@AuthenticationPrincipal Object user) {
        // 인증만 확인하면 됨(개인화 X)
        return ResponseEntity.ok(service.getPresets());
    }
}
