package com.healthsync.project.config;

import com.healthsync.project.security.jwt.JwtAuthenticationFilter;
import com.healthsync.project.security.jwt.JwtService;
import com.healthsync.project.security.oauth.CustomAuthorizationRequestResolver;
import com.healthsync.project.security.oauth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtService jwtService;

    @Value("${client.url:http://localhost:3000}")
    private String clientUrl;

    @Bean
    @Order(100)
    public SecurityFilterChain apiChain(HttpSecurity http,
                                        ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        // 인가요청 파라미터 커스터마이징(google/naver/kakao) 리졸버
        var resolver = new CustomAuthorizationRequestResolver(clientRegistrationRepository);

        http
                .securityMatcher("/oauth2/**", "/login/**", "/api/**", "/ping", "/calc/**", "/posts/**")
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/posts/**").permitAll()
                        .requestMatchers("/calc/**").permitAll()
                        .requestMatchers("/ping").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // ✅ 인증 필요한 엔드포인트를 먼저 명시
                        .requestMatchers("/api/auth/me", "/api/auth/nickname").authenticated()
                        // 그 외 /api/auth/** (로그인/리프레시/로그아웃 등)은 공개
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(o -> o
                        .authorizationEndpoint(a -> a.authorizationRequestResolver(resolver))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    @Order(200)
    public SecurityFilterChain defaultChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/**")
                .authorizeHttpRequests(a -> a.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                clientUrl,                 // 예: http://localhost:3000 (yml/prop로 주입)
                "http://localhost:5173"    // Vite 기본 포트
        ));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*")); // Authorization, X-Refresh-Token 포함
        cfg.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
