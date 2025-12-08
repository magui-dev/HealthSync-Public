package com.healthsync.project.openai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    /**
     * RestTemplate Bean 등록
     */
    @Primary
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder restTemplateBuilder) {
        return restTemplateBuilder

                .setConnectTimeout(Duration.ofSeconds(30)) // 서버와 연결을 맺는 시간: 10초
                .setReadTimeout(Duration.ofSeconds(30))    // 연결 후 응답을 기다리는 시간: 60초


                .additionalInterceptors(((request, body, execution) -> {
                    // step 1. Authorization 헤더 추가 (Bearer + API KEY)
                    request.getHeaders().add("Authorization", "Bearer " + apiKey);
                    // step 2. Content-Type 설정 (application/json)
                    request.getHeaders().add("Content-Type", "application/json");
                    // step 3. 요청 실행
                    return execution.execute(request, body);
                }))
                .build();
    }
}