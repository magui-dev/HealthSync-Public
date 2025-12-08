package com.healthsync.project.openai.service;

import com.healthsync.project.openai.dto.OpenAiMessage;
import com.healthsync.project.openai.dto.OpenAiRequest;
import com.healthsync.project.openai.dto.OpenAiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    @Qualifier("restTemplate")
    private final RestTemplate restTemplate;

    @Value("${openai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;
    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private static final String HEALTH_SYNC_PROMPT =
            "너는 'HealthSync' 서비스 소속의 전문 헬스케어 및 식단 관리 AI 어시스턴트야. " +

            "[너의 핵심 임무] " +
            "사용자에게 건강한 식단, 운동 방법, 영양 정보, 스트레스 관리법에 대해 과학적 근거를 바탕으로 조언해야 해. " +
            "항상 사용자의 건강 목표 달성을 돕는 것을 최우선으로 생각해. " +

            "[답변 규칙] " +
            "1. 절대로 의료적 진단, 질병의 원인 규명, 의약품 처방 및 추천을 해서는 안 돼. " +
            "2. 답변은 항상 친절하고 긍정적인 톤을 유지해 줘. " +
            "3. 인사나 일반적인 대화는 친절하게 받아줘. " +
            "   예: '안녕하세요!' → '안녕하세요! 건강 관련 도움이 필요하신가요?'" +
            "4. 사용자와 대화를 나누되, 만약 대화가 건강과 지속적으로 무관한 방향으로 진행되면 " +
            "   부드럽게 건강 주제로 유도해. 예: '좋은 말씀이네요. 그런데 혹시 식단이나 운동으로 도움을 드릴 만한 게 있을까요?'" +
            "5. 명백하게 건강과 무관한 주제(정치, 금융, 기술 심화 등)의 지속적인 질문에는 " +
            "   정중하게 '저는 건강 및 식단 전문 AI라서...'라고 표현해. " +
            "6. 모든 답변은 5문단의 길이로 요약해서 제공해 줘." +

            "\n\n[답변 형식 규칙]" +
            "\n1. 답변의 가독성을 높이기 위해 마크다운(Markdown)을 적극적으로 사용해줘." +
            "\n2. 각 식사(아침, 점심, 저녁, 간식)는 '### 아침', '### 점심'과 같이 마크다운 제목(헤딩 3단계)으로 명확히 구분해줘." +
            "\n3. 중요한 키워드나 음식 이름은 `**`로 감싸서 **굵은 글씨**로 강조해줘." +
            "\n4. 식단 예시처럼 나열이 필요한 정보는 반드시 `-` 기호를 사용한 목록(리스트) 형식으로 정리해줘." +

            "\n\n[대화 연속성 규칙]" +
            "\n1. 이전 대화 내용을 기억하고 맥락을 유지해줘." +
            "\n2. 사용자가 이전에 언급한 정보(이름, 상황, 목표 등)를 기억하고 활용해줘." +
            "\n3. '아까 말한', '이전에 물어본' 등의 표현이 나오면 대화 히스토리를 참고해줘.";

    /**
     * 대화 히스토리를 포함한 GPT 호출 (새로운 메인 메서드)
     */
    public OpenAiResponse getChatCompletionWithHistory(String context, List<OpenAiMessage> history, String prompt) {
        OpenAiRequest openAiRequest = buildRequestWithHistory(context, history, prompt);

        ResponseEntity<OpenAiResponse> chatResponse = restTemplate.postForEntity(
                apiUrl,
                openAiRequest,
                OpenAiResponse.class
        );

        if (!chatResponse.getStatusCode().is2xxSuccessful() || chatResponse.getBody() == null) {
            throw new RuntimeException("OpenAI API 호출 실패");
        }

        return chatResponse.getBody();
    }

    /**
     * 히스토리를 포함한 OpenAI 요청 구성
     */
    private OpenAiRequest buildRequestWithHistory(String context, List<OpenAiMessage> history, String prompt) {
        List<OpenAiMessage> messages = new ArrayList<>();

        // 1. 시스템 프롬프트 (기본 역할 + 사용자 컨텍스트)
        String systemContent = HEALTH_SYNC_PROMPT;
        if (context != null && !context.isEmpty()) {
            systemContent += "\n\n[현재 사용자의 리포트 정보] \n" + context +
                    "\n위 정보를 바탕으로 사용자 질문에 답변해줘.";
        }
        messages.add(new OpenAiMessage("system", systemContent));

        // 2. 대화 히스토리 추가 (요약 + 이전 대화들)
        if (history != null && !history.isEmpty()) {
            messages.addAll(history);
        }

        // 3. 현재 사용자 질문 추가
        messages.add(new OpenAiMessage("user", prompt));

        return new OpenAiRequest(model, messages);
    }

    /**
     * 기존 메서드 (하위 호환성 유지)
     */
    public OpenAiResponse getChatCompletion(String context, String prompt) {
        return getChatCompletionWithHistory(context, new ArrayList<>(), prompt);
    }
}
