package com.healthsync.project.account.profile.controller;

import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.healthsync.project.security.auth.AuthApi;

import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final AuthApi authApi;

    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody ProfileRequest profileRequest) {
        try {
            Long userId = authApi.getUserIdFromAuth(auth);
            profileService.updateProfile(userId, profileRequest);
            return ResponseEntity.ok("프로필이 정상 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("프로필 수정 중 오류가 발생했습니다.");
        }
    }
}