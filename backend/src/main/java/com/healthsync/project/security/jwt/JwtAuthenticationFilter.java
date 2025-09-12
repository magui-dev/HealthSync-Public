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

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // 1) Authorization 헤더(Bearer) 우선
        String token = resolveFromAuthorizationHeader(req);

        // 2) 없으면 HTTP-only 쿠키(AT)에서 시도
        if (!StringUtils.hasText(token)) {
            token = resolveFromCookie(req, "AT");
        }

        if (StringUtils.hasText(token)) {
            try {
                // ★ 0.12.x 대응: parse(token).getBody() → parseClaims(token)
                Claims claims = jwtService.parseClaims(token);

                // 만료 체크 (만료면 예외 없이 그냥 통과)
                if (!jwtService.isExpired(token)) {
                    String subject = claims.getSubject(); // email 또는 userId
                    var auth = new UsernamePasswordAuthenticationToken(
                            subject,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignore) {
                // 위조/형식 오류 등: 인증 세팅 안 하고 통과 → 이후 401 처리
            }
        }

        chain.doFilter(req, res);
    }

    private String resolveFromAuthorizationHeader(HttpServletRequest req) {
        String authz = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(authz) && authz.startsWith("Bearer ")) {
            return authz.substring(7);
        }
        return null;
    }

    private String resolveFromCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
