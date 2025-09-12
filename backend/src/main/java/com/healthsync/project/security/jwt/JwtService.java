package com.healthsync.project.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key; // ← SecretKey로 변경
    private final long accessExpSeconds;
    private final long refreshExpSeconds;

    public JwtService(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.access-exp-seconds}") long accessExpSeconds,
            @Value("${jwt.refresh-exp-seconds}") long refreshExpSeconds
    ) {
        byte[] secretBytes = Base64.getDecoder().decode(base64Secret);
        this.key = Keys.hmacShaKeyFor(secretBytes); // 반환 타입 SecretKey
        this.accessExpSeconds = accessExpSeconds;
        this.refreshExpSeconds = refreshExpSeconds;
    }

    public String createAccessToken(String userId, String name, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(accessExpSeconds);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(Map.of(
                        "name",  nullSafe(name),
                        "email", nullSafe(email)
                ))
                .signWith(key)
                .compact();
    }

    public String createRefreshToken(String userId) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(refreshExpSeconds);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key) // SecretKey 타입이면 정상 작동
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isExpired(String token) {
        try {
            Date exp = parseClaims(token).getExpiration();
            return exp == null || exp.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    private static String nullSafe(String v) {
        return v == null ? "" : v;
    }
}
