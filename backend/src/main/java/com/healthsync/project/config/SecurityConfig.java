package com.healthsync.project.config;

import com.healthsync.project.security.jwt.JwtAuthenticationFilter;
import com.healthsync.project.security.jwt.JwtService;
import com.healthsync.project.security.oauth.CustomAuthorizationRequestResolver;
import com.healthsync.project.security.oauth.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
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
                .securityMatcher("/oauth2/**", "/login/**", "/api/**", "/ping", "/calc/**", "/posts/**", "/nutri/**")
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/posts/**").authenticated()
                        .requestMatchers("/calc/**").permitAll()
                        .requestMatchers("/nutri/**").permitAll()
                        .requestMatchers("/ping").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // ✅ 인증 필요한 엔드포인트를 먼저 명시
                        .requestMatchers("/api/auth/me", "/api/auth/nickname").authenticated()
                        // 그 외 /api/auth/** (로그인/리프레시/로그아웃 등)은 공개
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
//                            // 🔐 인증이 필요한 경로들
//                            .requestMatchers("/posts/**", "/api/auth/me", "/api/auth/nickname").authenticated()
//                            // 🔓 인증이 필요 없는 경로들
//                            .requestMatchers("/calc/**", "/nutri/**", "/ping", "/oauth2/**", "/login/**", "/api/auth/**").permitAll()
//                            // ⬆️ 위에서 명시적으로 authenticated() 처리된 /api/auth/me 등은 permitAll() 규칙보다 우선 적용됩니다.
//                            // ❓ 그 외 모든 요청은 어떻게 할 것인가? (보통은 인증 요구)
//                            .anyRequest().authenticated()
                )
                // ✅ 폼로그인/베이식 인증 비활성화 (기본 /login 302 제거)
                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable())
                // ✅ 인증 실패는 401, 권한 부족은 403으로
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((req, res, e) ->
                                res.sendError(HttpServletResponse.SC_FORBIDDEN))
                )
                // ✅ 소셜 로그인만 사용
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
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); // 실제 프런트
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true); // ★ 필수
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }
}
