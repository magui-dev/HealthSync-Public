package com.healthsync.project.security.auth;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.domain.UserService;
import com.healthsync.project.security.jwt.CookieUtil;
import com.healthsync.project.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApi {
    private final JwtService jwtService;
    private final UserService userService;
    private final CookieUtil cookieUtil;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthenticated"));
        }
        Long userId = parseUserId(auth.getName());
        User u = userService.getById(userId);
        return ResponseEntity.ok(Map.of(
                "userId", u.getId(),
                "login", "jwt",
                "subject", u.getId().toString(),
                "email", u.getEmail(),
                "name", u.getName(),
                "nickname", u.getNickname(),
                "nicknameSet", u.isNicknameSet(),
                "provider", u.getProvider()
        ));
    }

    @PatchMapping("/nickname")
    public Map<String, String> changeNickname(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = parseUserId(auth.getName());
        String nickname = body.getOrDefault("nickname", "").trim();
        userService.updateNicknameById(userId, nickname);
        return Map.of("status", "ok");
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest req, HttpServletResponse res) {
        String refresh = cookieUtil.getRefreshTokenFromCookies(req);
        if (!jwtService.isValidRefresh(refresh)) {
            return ResponseEntity.status(401).build();
        }
        String subject = jwtService.getSubjectFromRefresh(refresh); // userId 문자열
        String newAccess = jwtService.createAccessToken(subject);

        res.addHeader(HttpHeaders.SET_COOKIE,
                cookieUtil.createAccessTokenCookie(newAccess).toString());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse res) {
        res.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearAccessTokenCookie().toString());
        res.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearRefreshTokenCookie().toString());
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private Long parseUserId(String subject) {
        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("인증 정보(subject)가 숫자 ID가 아닙니다.");
        }
    }
}
