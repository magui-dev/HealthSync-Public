package com.healthsync.project.security.auth;

import org.springframework.security.core.Authentication;

public final class SecurityUtil {
    private SecurityUtil() {}

    public static Long currentUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new IllegalStateException("인증 정보를 찾을 수 없습니다.");
        }
        try {
            return Long.parseLong(auth.getName()); // JwtAuthenticationFilter에서 subject=userId 로 세팅됨
        } catch (NumberFormatException e) {
            throw new IllegalStateException("인증 정보(subject)가 숫자 ID가 아닙니다.");
        }
    }
}
