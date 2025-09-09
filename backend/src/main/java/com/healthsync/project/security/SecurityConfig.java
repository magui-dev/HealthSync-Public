package com.healthsync.project.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain security(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/calc/**").permitAll()
                        .requestMatchers("/nutri/**").permitAll()
                        .requestMatchers("/",
                                "/ping",
                                "/public/**",
                                "/api/auth/register",
                                "/api/auth/login").permitAll()
                        .anyRequest().authenticated()
                )
                // 💡 여기 추가: 리다이렉트 대신 401/403 반환
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> res.sendError(401)) // 비로그인
                        .accessDeniedHandler((req, res, ex) -> res.sendError(403))      // 권한부족
                )
                // 폼 로그인: 이메일/비번을 x-www-form-urlencoded로 전송
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .successHandler((req, res, auth) -> res.setStatus(200))
                        .failureHandler((req, res, ex) -> res.sendError(401, "Bad credentials"))
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")  // 👉 REST 스타일 엔드포인트로 변경
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200)) // 👉 성공시 200 OK만 내려줌
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}