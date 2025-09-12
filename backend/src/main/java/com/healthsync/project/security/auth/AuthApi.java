package com.healthsync.project.security.auth;

import com.healthsync.project.security.jwt.JwtService;
import com.healthsync.project.security.jwt.RefreshTokenStore;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.domain.UserService; // ✅ 추가
import lombok.RequiredArgsConstructor;
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
    private final RefreshTokenStore refreshStore;
    private final UserService userService; // ✅ 주입

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) return Map.of("login", "anonymous");
        // subject = 이메일(위 SuccessHandler에서 보장)
        String email = auth.getName();
        User u = userService.getByEmail(email);
        return Map.of(
                "login", "jwt",
                "subject", email,
                "email", u.getEmail(),
                "name", u.getName(),
                "nickname", u.getNickname(),
                "nicknameSet", u.isNicknameSet()
        );
    }

    /** ✅ 닉네임 변경 */
    @PatchMapping("/nickname")
    public Map<String, String> changeNickname(Authentication auth, @RequestBody Map<String, String> body) {
        if (auth == null) throw new RuntimeException("unauthorized");
        String email = auth.getName();
        String nickname = body.getOrDefault("nickname", "").trim();
        userService.updateNicknameByEmail(email, nickname);
        return Map.of("status", "ok");
    }

    @PostMapping("/refresh")
    public Map<String, String> refresh(@RequestHeader("X-Refresh-Token") String refresh) {
        if (!refreshStore.exists(refresh)) {
            throw new RuntimeException("invalid refresh");
        }
        var claims = jwtService.parseClaims(refresh);
        var subject = claims.getSubject();
        var newAccess = jwtService.createAccessToken(subject, "", "");
        return Map.of("access", newAccess);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request,
                                      HttpServletResponse response,
                                      @RequestHeader(value = "X-Refresh-Token", required = false) String refresh) {
        if (refresh != null && !refresh.isBlank()) {
            refreshStore.delete(refresh);
        }
        try { request.logout(); } catch (Exception ignored) {}
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("status", "ok");
    }
}
