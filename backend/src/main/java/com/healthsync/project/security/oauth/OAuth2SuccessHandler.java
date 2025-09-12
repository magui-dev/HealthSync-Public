package com.healthsync.project.security.oauth;

import com.healthsync.project.security.jwt.JwtService;
import com.healthsync.project.security.jwt.RefreshTokenStore;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.domain.UserService; // ✅ 추가
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final RefreshTokenStore refreshStore;
    private final UserService userService; // ✅ 주입

    @Value("${client.url:http://localhost:3000}")
    private String clientUrl;

    @Value("${jwt.refresh-exp-seconds}")
    private long refreshExpSeconds;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication auth)
            throws IOException, ServletException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) auth;
        String provider = token.getAuthorizedClientRegistrationId(); // google / kakao / naver
        OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
        Map<String, Object> attrs = oauth2User.getAttributes();

        // 표준화된 프로필 추출
        String email = extractEmail(provider, attrs);
        String name  = extractName(provider, attrs);

        // ✅ 이메일은 필수 (엔티티가 not null)
        if (email == null || email.isBlank()) {
            // 스코프에 email 동의를 포함시키거나, 학원 과제 기준이면 실패 처리
            response.sendError(400, "Email consent is required");
            return;
        }

        // ✅ 유저 upsert (처음이면 자동 닉네임 생성)
        User user = userService.upsertSocial(email, name);

        // ✅ subject는 email로 고정 (토큰 subject = 이메일)
        String subject = user.getEmail();

        // 토큰 발급
        String access  = jwtService.createAccessToken(subject, user.getName(), user.getEmail());
        String refresh = jwtService.createRefreshToken(subject);

        long expAt = Instant.now().getEpochSecond() + refreshExpSeconds;
        refreshStore.save(refresh, expAt);

        String redirect = clientUrl + "/auth/success#access=" + access + "&refresh=" + refresh;
        response.sendRedirect(redirect);
    }

    // ... 아래 extractEmail/extractName/isSecure/addCookie 는 네 코드 그대로 유지 ...
    @SuppressWarnings("unchecked")
    private String extractEmail(String provider, Map<String, Object> attrs) {
        switch (provider) {
            case "google":
                return (String) attrs.get("email");
            case "kakao": {
                Object accObj = attrs.get("kakao_account");
                Map<String, Object> account = (accObj instanceof Map) ? (Map<String, Object>) accObj : Map.of();
                Object email = account.get("email");
                return email == null ? null : email.toString();
            }
            case "naver": {
                Object respObj = attrs.get("response");
                Map<String, Object> resp = (respObj instanceof Map) ? (Map<String, Object>) respObj : Map.of();
                Object email = resp.get("email");
                return email == null ? null : email.toString();
            }
            default:
                return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractName(String provider, Map<String, Object> attrs) {
        switch (provider) {
            case "google":
                return String.valueOf(attrs.getOrDefault("name", ""));
            case "kakao": {
                Object accObj = attrs.get("kakao_account");
                Map<String, Object> account = (accObj instanceof Map) ? (Map<String, Object>) accObj : Map.of();
                Object profObj = account.get("profile");
                Map<String, Object> profile = (profObj instanceof Map) ? (Map<String, Object>) profObj : Map.of();
                Object nick = profile.get("nickname");
                return nick == null ? "" : nick.toString();
            }
            case "naver": {
                Object respObj = attrs.get("response");
                Map<String, Object> resp = (respObj instanceof Map) ? (Map<String, Object>) respObj : Map.of();
                Object name = resp.get("name");
                return name == null ? "" : name.toString();
            }
            default:
                return "";
        }
    }

    private boolean isSecure() { return clientUrl.startsWith("https"); }

    private void addCookie(HttpServletResponse res, String name, String value, int maxAgeSec, boolean secure) {
        String sameSite = secure ? "None" : "Lax";
        res.addHeader("Set-Cookie",
                "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=%s%s"
                        .formatted(name, value, maxAgeSec, sameSite, secure ? "; Secure" : ""));
    }
}
