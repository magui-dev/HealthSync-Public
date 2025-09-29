package com.healthsync.project.security.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String ACCESS_COOKIE = "accessToken"; // ★ 액세스 토큰 쿠키명 통일
    private final JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || uri.startsWith("/oauth2/")
                || uri.startsWith("/login/oauth2/");
        // ⚠ /api/auth/** 는 필터 태우는 게 맞습니다(토큰 있어도 없이도 동작해야 하므로).
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveFromCookie(req, ACCESS_COOKIE);

        if (StringUtils.hasText(token)) {
            try {
                if (!jwtService.isExpired(token) && jwtService.isAccessToken(token)) {
                    Claims claims = jwtService.parseClaims(token);
                    String subject = claims.getSubject(); // ★ userId(문자열)이어야 AuthApi와 일치

                    // roles 클레임이 있으면 사용, 없으면 ROLE_USER 기본
                    List<SimpleGrantedAuthority> authorities =
                            jwtService.extractAuthorities(claims)
                                    .orElse(List.of(new SimpleGrantedAuthority("ROLE_USER")));

                    var auth = new UsernamePasswordAuthenticationToken(subject, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // 만료/타입불일치: 인증 컨텍스트 세팅하지 않음 → 이후 401 처리됨
                }
            } catch (Exception ignore) {
                // 서명위조/형식오류 등: 인증 컨텍스트 세팅 없이 통과
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
