package com.healthsync.project.account.profile.controller;

import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.service.ProfileService;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.healthsync.project.security.auth.AuthApi;

@RestController
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;
    private final AuthApi authApi;

    @PutMapping
    public ResponseEntity<Void> updateProfile(Authentication auth, @RequestBody ProfileRequest profileRequest) {
//        Long userId = getUserIdFromAuth(auth);
        Long userId = authApi.getUserIdFromAuth(auth);
        profileService.updateProfile(userId, profileRequest);
        return ResponseEntity.ok().build();
    }

//    private Long getUserIdFromAuth(Authentication auth) {
//        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보를 찾을 수 없습니다.");
//        }
//        String userIdStr = auth.getName();
//        try {
//            return Long.parseLong(userIdStr);
//        } catch (NumberFormatException e) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보(ID)가 올바르지 않습니다.");
//        }
//    }

}