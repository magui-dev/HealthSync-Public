package com.healthsync.project.security.jwt;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

public class CookieUtil {
    public static void addCookie(HttpServletResponse res, String name, String value, long maxAgeSec, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(secure ? "None" : "Lax") // 로컬은 Lax, 배포는 None+HTTPS
                .maxAge(maxAgeSec)
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    public static void deleteCookie(HttpServletResponse res, String name, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(secure ? "None" : "Lax")
                .maxAge(0)
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }
}
