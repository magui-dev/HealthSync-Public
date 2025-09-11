package com.healthsync.project.logintest.controller;

import com.healthsync.project.logintest.dto.LoginRequest;
import com.healthsync.project.logintest.dto.LoginUser;
import com.healthsync.project.logintest.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/logintest")
public class LoginController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginController(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }


    /**
     * JSON 로그인: {"email":"...", "password":"..."}
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            request.getSession(true);

// ★ principal을 LoginUser로 받음
            LoginUser user = (LoginUser) auth.getPrincipal();

// ★ JWT에 id, sub(email), roles를 넣도록 수정
            String accessToken = jwtService.generateAccessToken(user); // user.getId(), user.getUsername(), user.getAuthorities()
            addCookie(response, "accessToken", accessToken, Duration.ofMinutes(30), true, false);

            return ResponseEntity.ok(Map.of("message", "login ok", "accessToken", accessToken));
        } catch (AuthenticationException e) {
            throw new RuntimeException(e);
        }
    }


    /**
     * 현재 사용자 정보 (로그인 필요)
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "authorities", user.getAuthorities()
        ));
    }

    /**
     * 로그아웃 (세션 무효화 + 컨텍스트 정리)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        new org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler()
                .logout(request, response, auth);

        // 쿠키 제거(선택)
        clearCookie(response, "accessToken");
        // clearCookie(response, "refreshToken");

        return ResponseEntity.ok(Map.of("message", "logout ok"));
    }

    private void addCookie(HttpServletResponse res, String name, String value,
                           Duration maxAge, boolean httpOnly, boolean secure) {
        Cookie c = new Cookie(name, value);
        c.setHttpOnly(httpOnly);
        c.setSecure(secure);
        c.setPath("/");
        c.setMaxAge((int) maxAge.getSeconds());
        res.addCookie(c);
    }

    private void clearCookie(HttpServletResponse res, String name) {
        Cookie c = new Cookie(name, null);
        c.setHttpOnly(true);
        c.setSecure(false); // prod면 true
        c.setPath("/");
        c.setMaxAge(0);
        res.addCookie(c);
    }
}
