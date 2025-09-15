package com.healthsync.project.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String accessSecretBase64;
    @Value("${jwt.secret}")
    private String refreshSecretBase64;

    @Value("${jwt.access-exp-seconds:1800}")
    private long accessTtlSeconds;
    @Value("${jwt.refresh-exp-seconds:1209600}")
    private long refreshTtlSeconds;

    private SecretKey accessKey;
    private SecretKey refreshKey;

    @PostConstruct
    void init() {
        accessKey  = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessSecretBase64));
        refreshKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshSecretBase64));
    }

    // ✅ (A) 단일 인자 오버로드 — 지금 에러 해결 포인트
    public String createAccessToken(String subject) {
        return createAccessToken(subject, Collections.emptyMap());
    }


    // ===== 발급 =====
    public String createAccessToken(String subject, String name, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("name", name);
        claims.put("email", email);
        // 필요 시 권한 추가
        // claims.put("roles", List.of("ROLE_USER"));
        return createAccessToken(subject, claims);
    }

    public String createAccessToken(String subject, Map<String, Object> extraClaims) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(accessTtlSeconds);
        Map<String,Object> claims = new HashMap<>(extraClaims != null ? extraClaims : Map.of());
        claims.putIfAbsent("typ", "access");
        // 필요 시 roles 등 추가: claims.put("roles", List.of("ROLE_USER"));
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(accessKey, Jwts.SIG.HS256)
                .compact();
    }

    public String createRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(refreshTtlSeconds);
        Map<String,Object> claims = Map.of("typ", "refresh");
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(refreshKey, Jwts.SIG.HS256)
                .compact();
    }

    // ===== 파싱/검증 =====

    /** access/refresh 키를 자동으로 시도해서 Claims 반환 */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser().verifyWith(accessKey).build()
                    .parseSignedClaims(token).getPayload();
        } catch (Exception ignore) {
            // access 키로 안 풀리면 refresh 키로 시도
            return Jwts.parser().verifyWith(refreshKey).build()
                    .parseSignedClaims(token).getPayload();
        }
    }

    public boolean isValidRefresh(String token) {
        try {
            // refresh 키로 파싱 (access 키가 아닌 "refreshKey"로 검증되어야 함)
            Claims c = Jwts.parser().verifyWith(refreshKey).build()
                    .parseSignedClaims(token).getPayload();

            // typ=refresh 확인
            Object typ = c.get("typ");
            if (!"refresh".equals(typ)) return false;

            // 만료 확인
            Date exp = c.getExpiration();
            return exp != null && exp.after(new Date());
        } catch (Exception e) {
            return false; // 파싱/서명 검증 실패 등
        }
    }

    public boolean isExpired(String token) {
        try {
            Claims c = parseClaims(token);
            Date exp = c.getExpiration();
            return exp == null || exp.before(new Date());
        } catch (Exception e) {
            return true; // 파싱 실패도 만료 취급
        }
    }

    /** typ 클레임으로 액세스 토큰인지 판별 */
    public boolean isAccessToken(String token) {
        try {
            Claims c = parseClaims(token);
            Object typ = c.get("typ");
            return "access".equals(typ);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(refreshKey).build()
                    .parseSignedClaims(token).getPayload();
            return "refresh".equals(c.get("typ"));
        } catch (Exception e) { return false; }
    }

    public String getSubjectFromRefresh(String token) {
        Claims c = Jwts.parser().verifyWith(refreshKey).build()
                .parseSignedClaims(token).getPayload();
        return c.getSubject();
    }

    public String getSubject(String token) {
        return parseClaims(token).getSubject();
    }

    /** roles 클레임이 있을 경우 권한으로 변환 */
    public Optional<List<SimpleGrantedAuthority>> extractAuthorities(Claims claims) {
        Object raw = claims.get("roles");
        if (raw instanceof Collection<?> coll) {
            List<SimpleGrantedAuthority> list = coll.stream()
                    .map(Object::toString)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return Optional.of(list);
        }
        return Optional.empty();
    }
}

//@Service
//public class JwtService {
//
//    private final SecretKey key; // ← SecretKey로 변경
//    private final long accessExpSeconds;
//    private final long refreshExpSeconds;
//
//    public JwtService(
//            @Value("${jwt.secret}") String base64Secret,
//            @Value("${jwt.access-exp-seconds}") long accessExpSeconds,
//            @Value("${jwt.refresh-exp-seconds}") long refreshExpSeconds
//    ) {
//        byte[] secretBytes = Base64.getDecoder().decode(base64Secret);
//        this.key = Keys.hmacShaKeyFor(secretBytes); // 반환 타입 SecretKey
//        this.accessExpSeconds = accessExpSeconds;
//        this.refreshExpSeconds = refreshExpSeconds;
//    }
//
//    public String createAccessToken(String userId, String name, String email) {
//        Instant now = Instant.now();
//        Instant exp = now.plusSeconds(accessExpSeconds);
//
//        return Jwts.builder()
//                .subject(userId)
//                .issuedAt(Date.from(now))
//                .expiration(Date.from(exp))
//                .claims(Map.of(
//                        "name",  nullSafe(name),
//                        "email", nullSafe(email)
//                ))
//                .signWith(key)
//                .compact();
//    }
//
//    public String createRefreshToken(String userId) {
//        Instant now = Instant.now();
//        Instant exp = now.plusSeconds(refreshExpSeconds);
//
//        return Jwts.builder()
//                .subject(userId)
//                .issuedAt(Date.from(now))
//                .expiration(Date.from(exp))
//                .signWith(key)
//                .compact();
//    }
//
//    public Claims parseClaims(String token) {
//        return Jwts.parser()
//                .verifyWith(key) // SecretKey 타입이면 정상 작동
//                .build()
//                .parseSignedClaims(token)
//                .getPayload();
//    }
//
//    public boolean isExpired(String token) {
//        try {
//            Date exp = parseClaims(token).getExpiration();
//            return exp == null || exp.before(new Date());
//        } catch (Exception e) {
//            return true;
//        }
//    }
//
//    private static String nullSafe(String v) {
//        return v == null ? "" : v;
//    }
//}
