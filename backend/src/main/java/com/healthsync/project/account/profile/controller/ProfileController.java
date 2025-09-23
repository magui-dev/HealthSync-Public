package com.healthsync.project.account.profile.controller;

import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.dto.ProfileResponse;
import com.healthsync.project.account.profile.service.ProfileService;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
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

    /**
     프로필 정보 조회.0922추가
     */
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        try {
            Long userId = authApi.getUserIdFromAuth(auth);
            // DTO를 반환하는 서비스 메서드 호출
            ProfileResponse profileResponse = profileService.getProfileDtoByUserId(userId);
            return ResponseEntity.ok(profileResponse); // DTO를 클라이언트에 반환
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("프로필 조회 중 오류가 발생했습니다.");
        }
    }


}