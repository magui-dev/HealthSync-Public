package com.healthsync.project.account.profile.controller;

import com.healthsync.project.security.auth.SecurityUtil;
import org.springframework.web.multipart.MultipartFile;
import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.dto.ProfileResponse;
import com.healthsync.project.account.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.healthsync.project.security.auth.AuthApi;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/profile", "/api/profile"})
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        Long userId = SecurityUtil.currentUserId(auth);
        ProfileResponse profileResponse = profileService.getProfileFromUser(userId);
        return ResponseEntity.ok(profileResponse);
    }

    @PutMapping("/edit")
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody ProfileRequest profileRequest) {
        try {
            Long userId = SecurityUtil.currentUserId(auth);
            profileService.updateProfile(userId, profileRequest);
            return ResponseEntity.ok("프로필이 정상 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("프로필 수정 중 오류가 발생했습니다.");
        }
    }

}
