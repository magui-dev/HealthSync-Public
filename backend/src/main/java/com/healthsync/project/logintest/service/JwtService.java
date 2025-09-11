package com.healthsync.project.logintest.service;

import com.healthsync.project.logintest.dto.LoginUser;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JwtService {

    @Value("${logintest.jwt.secret}")
    private String secret; // 0.9.1에서는 byte[]/String로 바로 사용

    @Value("${logintest.jwt.access-minutes:30}")
    private long accessMinutes;

    @Value("${logintest.jwt.refresh-days:14}")
    private long refreshDays;

    private byte[] keyBytes() {
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateAccessToken(LoginUser user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));

        Instant now = Instant.now();

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername()) // email
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(accessMinutes, ChronoUnit.MINUTES)))
                // ★ 0.9.1: (alg, key) 순서
                .signWith(SignatureAlgorithm.HS256, keyBytes())
                .compact();
    }

    /** 토큰 유효성 검사: 서명/형식/만료 모두 체크 */
    public boolean validate(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(keyBytes())
                    .parseClaimsJws(token)
                    .getBody();

            Date exp = claims.getExpiration();
            return exp != null && exp.after(new Date());
        } catch (SignatureException | MalformedJwtException | UnsupportedJwtException |
                 IllegalArgumentException | ExpiredJwtException e) {
            // 필요하면 로그 남기기
            return false;
        }
    }

    /** Refresh Token 발급 (typ=refresh) */
    public String generateRefreshToken(UserDetails user) {
        Instant now = Instant.now();

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        claims.put("typ", "refresh");

        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(user.getUsername())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(refreshDays, ChronoUnit.DAYS)))
                .addClaims(claims)
                // ★ 0.9.1: (alg, key) 순서
                .signWith(SignatureAlgorithm.HS256, keyBytes())
                .compact();
    }

    /** username(email) 추출 */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** 토큰 유효성 검사 (subject 일치 + 만료 확인) */
    public boolean isTokenValid(String token, UserDetails user) {
        try {
            Claims c = parseClaims(token);
            return user.getUsername().equals(c.getSubject())
                    && c.getExpiration() != null
                    && c.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    /** 클레임 파싱 (0.9.1 스타일) */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .setSigningKey(keyBytes())
                .parseClaimsJws(token)
                .getBody();
    }
}

