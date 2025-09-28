package com.healthsync.project.openai.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.openai.dto.ChatRequest;
import com.healthsync.project.openai.dto.OpenAiResponse;
import com.healthsync.project.openai.dto.ReportContextDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final OpenAiClient openAiClient;
    /**
     * 클라이언트 질문을 받아 OpenAI 응답 텍스트 반환
     */
    public String getAnswer(Long userId, ChatRequest chatRequest) {

        // 1. 프론트에서 받은 컨텍스트 데이터 DTO를 가져옵니다.
        ReportContextDto contextDto = chatRequest.getReportContext();

        // 2. 받은 DTO가 null인지 확인 (선택적 예외 처리)
        if (contextDto == null) {
            // 컨텍스트 없이 일반적인 답변을 하거나, 오류를 반환할 수 있습니다.
            // 여기서는 컨텍스트 없이 질문만 넘깁니다.
            OpenAiResponse openAiResponse = openAiClient.getChatCompletion(null, chatRequest.getMessage());
            return openAiResponse.getChoices().get(0).getMessage().getContent();
        }

        // 3. DTO를 AI가 이해하기 쉬운 문자열로 변환합니다.
        String context = buildUserContext(contextDto);

        // step 1. OpenAiClient를 통해 질문을 OpenAI에 전달
        log.info("Request from User ID: {}, Question: {}", userId, chatRequest.getMessage());
        OpenAiResponse openAiResponse = openAiClient.getChatCompletion(context, chatRequest.getMessage());
        return openAiResponse.getChoices().get(0).getMessage().getContent();

//        OpenAiResponse openAiResponse = openAiClient.getChatCompletion(question);
//        // step 2. 응답 중 첫 번째 메세지의 content 추출
//        return openAiResponse.getChoices().get(0).getMessage().getContent();
    }

    // 사용자 정보를 AI가 이해하기 쉬운 텍스트로 변환하는 헬퍼 메소드
    private String buildUserContext(ReportContextDto dto) {
        // DTO의 getter를 사용해 문자열을 안전하게 구성합니다.
        return String.format(
                "사용자 닉네임: %s, 나이: %d세, 성별: %s, 키: %.1fcm, 현재 체중: %.1fkg. " +
                        "기초대사량(BMR): %.0f kcal, 활동대사량(TDEE): %.0f kcal. " +
                        "현재 진행중인 목표는 '%d주 동안 %.1fkg에서 %.1fkg으로 체중 조절'이며, " +
                        "목표 달성을 위한 일일 권장 섭취 칼로리는 %.0f kcal 입니다.",
                dto.getNickname(),
                dto.getAge(),
                "MALE".equalsIgnoreCase(dto.getGender()) ? "남성" : "여성",
                dto.getHeight(),
                dto.getStartWeightKg(),
                dto.getBasalMetabolism(),
                dto.getDailyCalories(),
                dto.getWeeks(),
                dto.getStartWeightKg(),
                dto.getTargetWeightKg(),
                dto.getTargetDailyCalories()
        );
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