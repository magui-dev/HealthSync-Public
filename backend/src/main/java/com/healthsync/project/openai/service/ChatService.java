package com.healthsync.project.openai.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.openai.dto.OpenAiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final OpenAiClient openAiClient;
    private final UserRepository userRepository;

    /**
     * 클라이언트 질문을 받아 OpenAI 응답 텍스트 반환
     */
    public String getAnswer(Long userId, String question) {

//        User author = userRepository.getReferenceById(userId);
//
//        // 어떤 사용자가 어떤 질문을 했는지 로그를 남겨서 나중에 사용 패턴을 분석하거나 디버깅할 수 있습니다.
//        log.info("Request from User: {} (ID: {}), Question: {}", author.getNickname(), userId, question);

        // step 1. OpenAiClient를 통해 질문을 OpenAI에 전달
        OpenAiResponse openAiResponse = openAiClient.getChatCompletion(question);

        // step 2. 응답 중 첫 번째 메세지의 content 추출
        return openAiResponse.getChoices().get(0).getMessage().getContent();
    }

}


//@Service
//public class ChatService {
//
//    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
//
//    public String askGPT(String prompt) {
//        try {
//            RestTemplate restTemplate = new RestTemplate();
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//            headers.setBearerAuth(System.getenv("OPENAI_API_KEY"));
//
//            Map<String, Object> body = new HashMap<>();
//            body.put("model", "gpt-3.5-turbo"); // 또는 gpt-4o, gpt-3.5-turbo 등
//            body.put("messages", List.of(
//                    Map.of("role", "system", "content", "너는 식단 관리 및 헬스케어 전문가야."),
//                    Map.of("role", "user", "content", prompt)
//            ));
//
//            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
//
//            Map<String, Object> response = restTemplate.postForObject(
//                    OPENAI_API_URL, request, Map.class
//            );
//
//            // OpenAI 응답 파싱
//            if (response != null) {
//                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
//                if (choices != null && !choices.isEmpty()) {
//                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
//                    return (String) message.get("content");
//                }
//            }
//            return "⚠️ 응답을 불러올 수 없습니다.";
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return "⚠️ 오류 발생: " + e.getMessage();
//        }
//    }
//}