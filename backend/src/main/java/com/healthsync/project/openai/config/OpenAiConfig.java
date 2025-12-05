package com.healthsync.project.openai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

//@Configuration
//public class OpenAIConfig {
//
//    @Bean
//    public OpenAiService openAiService() {
//        // 환경변수에서 OpenAI API Key 가져오기
//        String apiKey = System.getenv("OPENAI_API_KEY");
//
//        // ✅ 디버그용: 콘솔에 키 확인
//        System.out.println("DEBUG: OPENAI_API_KEY=" + apiKey);
//
//        // 키가 null이면 예외 처리 (선택 사항)
//        if (apiKey == null || apiKey.isEmpty()) {
//            throw new IllegalStateException("환경변수 OPENAI_API_KEY가 설정되지 않았습니다!");
//        }
//
//        // OpenAiService Bean 생성
//        return new OpenAiService(apiKey);
//    }
//}

@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    /**
     * RestTemplate Bean 등록
     */
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