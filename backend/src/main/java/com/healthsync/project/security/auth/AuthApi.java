package com.healthsync.project.security.auth;

import com.healthsync.project.security.jwt.CookieUtil;
import com.healthsync.project.security.jwt.JwtService;
import com.healthsync.project.security.jwt.RefreshTokenStore;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.domain.UserService; // ✅ 추가
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
    private final UserService userService; // ✅ 주입
    private final CookieUtil cookieUtil;

//    @GetMapping("/me")
//    public Map<String, Object> me(Authentication auth) {
//        if (auth == null) return Map.of("login", "anonymous");
//        // subject = 이메일(위 SuccessHandler에서 보장)
//        String email = auth.getName();
//        User u = userService.getByEmail(email);
//        return Map.of(
//                "userId", u.getId(),
//                "login", "jwt",
//                "subject", email,
//                "email", u.getEmail(),
//                "name", u.getName(),
//                "nickname", u.getNickname(),
//                "nicknameSet", u.isNicknameSet()
//        );
//    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        User u = userService.getById(userId);

        return Map.of(
                "userId", u.getId(),
                "login", "jwt",
                "subject", u.getId().toString(), // subject는 이제 userId입니다.
                "email", u.getEmail(),
                "name", u.getName(),
                "nickname", u.getNickname(),
                "nicknameSet", u.isNicknameSet()
        );
    }

    @PatchMapping("/nickname")
    public Map<String, String> changeNickname(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = getUserIdFromAuth(auth);
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
        String subject = jwtService.getSubjectFromRefresh(refresh); // 또는 parseClaims(refresh).getSubject()
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

    // ✅ PostController에 있던 헬퍼 메서드를 여기에도 추가해줍니다.
    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new IllegalStateException("인증 정보를 찾을 수 없습니다.");
        }
        String userIdStr = auth.getName();
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("인증 정보가 올바르지 않습니다 (ID가 숫자가 아님).");
        }
    }
}
