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
import org.springframework.http.HttpMethod;
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
        var resolver = new CustomAuthorizationRequestResolver(clientRegistrationRepository);

        http
                .securityMatcher("/**") // 모든 요청 여기에 들어와서 아래 authorize 규칙 적용
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // CORS 프리플라이트
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 헬스체크/핑 등 공개해도 되는 엔드포인트
                        .requestMatchers("/ping", "/actuator/health", "/error").permitAll()

                        // OAuth2 엔드포인트는 반드시 공개
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()

                        // 인증/토큰 관련 공개 엔드포인트
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()

                        // 🔒 로그인 확인 및 계정 수정 등은 보호
                        .requestMatchers("/api/auth/me", "/api/auth/nickname").authenticated()

                        // 🔒 여기서부터는 “모든 API 기본 잠금”
                        //  * 과거에 permitAll 하던 /calc/**, /nutri/**, /api/nutri/**, /api/plan/** 등은
                        //    “로그인 필요한 서비스로 바꿀” 계획이면 아래 anyRequest()에 의해 자동으로 잠깁니다.
                        //    만약 계속 공개가 필요하면 그 경로만 위에 .permitAll()로 명시 예외 처리하세요.
                        .anyRequest().authenticated()
                )
                // 폼/베이식 비활성화 (우리는 OAuth2 + JWT 사용)
                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable())
                // 인증/권한 실패 응답 코드 표준화
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((req, res, e) -> res.sendError(HttpServletResponse.SC_FORBIDDEN))
                )
                // OAuth2 로그인(성공 시 토큰 발급 핸들러)
                .oauth2Login(o -> o
                        .authorizationEndpoint(a -> a.authorizationRequestResolver(resolver))
                        .successHandler(oAuth2SuccessHandler)
                )
                // JWT 필터 장착 (UsernamePasswordAuthenticationFilter 앞)
                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // (선택) 나머지 체인은 필요 없으므로 제거해도 되지만, 남겨도 무해.
    @Bean
    @Order(200)
    public SecurityFilterChain defaultChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/__never__/__hit__") // 어떤 요청도 매칭 안 되도록
                .authorizeHttpRequests(a -> a.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of(
                "http://localhost:5173", // Vite
                "http://localhost:3000", // CRA/Next dev
                clientUrl                  // 배포 프론트 도메인
        ));
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }
}
