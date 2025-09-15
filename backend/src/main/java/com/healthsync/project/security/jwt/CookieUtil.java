package com.healthsync.project.security.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtil {

    private final boolean secure;
    private final String sameSite;
    private final String domain; // null 가능(로컬용)
    private final Duration accessTtl;
    private final Duration refreshTtl;

    // 필요 시 @ConfigurationProperties 로 주입하거나 프로파일별 @Bean 으로 주입
    public CookieUtil() {
        // 기본값: 로컬 개발 기준
        this.secure = false;                 // prod 에선 true
        this.sameSite = "Lax";               // prod 에선 "None"
        this.domain = null;                  // prod 에선 예: "example.com"
        this.accessTtl = Duration.ofHours(1);
        this.refreshTtl = Duration.ofDays(7);
    }

    public ResponseCookie createAccessTokenCookie(String token) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .path("/")
                .maxAge(accessTtl)
                .secure(secure)
                .sameSite(sameSite);
        if (domain != null) b.domain(domain);
        return b.build();
    }

    public ResponseCookie createRefreshTokenCookie(String token) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .path("/")
                .maxAge(refreshTtl)
                .secure(secure)
                .sameSite(sameSite);
        if (domain != null) b.domain(domain);
        return b.build();
    }

    public ResponseCookie clearCookie(String name) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from(name, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .secure(secure)
                .sameSite(sameSite);
        if (domain != null) b.domain(domain);
        return b.build();
    }

    public ResponseCookie clearAccessTokenCookie() {
        return clearCookie("accessToken");
    }

    public ResponseCookie clearRefreshTokenCookie() {
        return clearCookie("refreshToken");
    }

    public String getAccessTokenFromCookies(HttpServletRequest req) {
        return getCookieValue(req, "accessToken");
    }

    public String getRefreshTokenFromCookies(HttpServletRequest req) {
        return getCookieValue(req, "refreshToken");
    }

    public String getCookieValue(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        Optional<Cookie> c = Arrays.stream(req.getCookies())
                .filter(it -> name.equals(it.getName()))
                .findFirst();
        return c.map(Cookie::getValue).orElse(null);
    }
}

//@Component
//public class CookieUtil {
//    public ResponseCookie createAccessTokenCookie(String access) {
//        return ResponseCookie.from("accessToken", access)
//                .httpOnly(true)
//                .path("/")
//                .maxAge(Duration.ofHours(1))
//                .sameSite("None")
//                .secure(true)
//                .build();
//    }
//
//    public ResponseCookie createRefreshTokenCookie(String refresh) {
//        return ResponseCookie.from("refreshToken", refresh)
//                .httpOnly(true)
//                .path("/")
//                .maxAge(Duration.ofDays(7))
//                .sameSite("None")
//                .secure(true)
//                .build();
//    }
//
//    public ResponseCookie clearCookie(String name) {
//        return ResponseCookie.from(name, "")
//                .httpOnly(true)
//                .path("/")
//                .maxAge(0)
//                .sameSite("None")
//                .secure(true)
//                .build();
//    }
//
//
//    public static void addCookie(HttpServletResponse res, String name, String value, long maxAgeSec, boolean secure) {
//        ResponseCookie cookie = ResponseCookie.from(name, value)
//                .httpOnly(true)
//                .secure(secure)
//                .path("/")
//                .sameSite(secure ? "None" : "Lax") // 로컬은 Lax, 배포는 None+HTTPS
//                .maxAge(maxAgeSec)
//                .build();
//        res.addHeader("Set-Cookie", cookie.toString());
//    }
//
//    public static void deleteCookie(HttpServletResponse res, String name, boolean secure) {
//        ResponseCookie cookie = ResponseCookie.from(name, "")
//                .httpOnly(true)
//                .secure(secure)
//                .path("/")
//                .sameSite(secure ? "None" : "Lax")
//                .maxAge(0)
//                .build();
//        res.addHeader("Set-Cookie", cookie.toString());
//    }
//}
