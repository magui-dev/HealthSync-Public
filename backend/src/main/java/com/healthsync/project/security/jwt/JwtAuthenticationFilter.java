package com.healthsync.project.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import io.jsonwebtoken.Claims;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;


@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String ACCESS_COOKIE = "accessToken"; // ★ 통일
    private final JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || uri.startsWith("/oauth2/")
                || uri.startsWith("/login/oauth2/");
        // ✅ /api/auth/** 는 스킵하지 마세요.
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveFromCookie(req, ACCESS_COOKIE); // ★ 쿠키만 사용

        if (StringUtils.hasText(token)) {
            try {
                if (!jwtService.isExpired(token) && jwtService.isAccessToken(token)) {
                    Claims claims = jwtService.parseClaims(token);
                    String subject = claims.getSubject(); // email or userId

                    // roles 클레임이 있으면 꺼내 쓰기(없으면 ROLE_USER 기본)
                    List<SimpleGrantedAuthority> authorities = jwtService.extractAuthorities(claims)
                            .orElse(List.of(new SimpleGrantedAuthority("ROLE_USER")));

                    var auth = new UsernamePasswordAuthenticationToken(subject, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // 만료: 컨텍스트 세팅 안 함 → 이후 401 처리
                    req.setAttribute("accessExpired", true); // (선택) 후속 처리용 힌트
                }
            } catch (Exception ignore) {
                // 서명 위조/형식 오류 등: 컨텍스트 세팅 없이 통과 → 이후 401
            }
        }

        chain.doFilter(req, res);
    }

    private String resolveFromCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
