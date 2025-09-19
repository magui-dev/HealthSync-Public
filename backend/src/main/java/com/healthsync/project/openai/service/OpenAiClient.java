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

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    @Qualifier("restTemplate") // OpenAI용 RestTemplate 빈의 이름을 지정
    private final RestTemplate restTemplate;

    @Value("${openai.api-url}")
    private String apiUrl;
    @Value("${openai.model}")
    private String model;

    /**
     * 사용자 질문을 GPT 모델에 전달하고 응답 받기
     */
    public OpenAiResponse getChatCompletion(String prompt) {
        // step 1. OpenAI 요청 구성
        OpenAiRequest openAiRequest = getOpenAiRequest(prompt);

        // step 2. RestTemplate을 통해 OpenAI API POST 요청 전송
        ResponseEntity<OpenAiResponse> chatResponse = restTemplate.postForEntity(
                apiUrl,
                openAiRequest,
                OpenAiResponse.class
        );

        // step 3. 응답 실패 처리
        if (!chatResponse.getStatusCode().is2xxSuccessful() || chatResponse.getBody() == null) {
            throw new RuntimeException("OpenAI API 호출 실패");
        }

        // step 4. 성공 시 응답 본문 반환
        return chatResponse.getBody();
    }

    /**
     * OpenAI 요청 구성
     */
    private OpenAiRequest getOpenAiRequest(String prompt) {
        // step 1-1. system 메세지 작성 - AI 역할 지시
        String healthSyncPrompt = "너는 'HealthSync' 서비스 소속의 전문 헬스케어 및 식단 관리 AI 어시스턴트야. " +
                "[너의 핵심 임무] " +
                "사용자에게 건강한 식단, 운동 방법, 영양 정보, 스트레스 관리법에 대해 과학적 근거를 바탕으로 조언해야 해. " +
                "항상 사용자의 건강 목표 달성을 돕는 것을 최우선으로 생각해. " +
                "[답변 규칙] " +
                "1. 절대로 의료적 진단, 질병의 원인 규명, 의약품 처방 및 추천을 해서는 안 돼. 사용자가 진단을 요구하면, '저는 의료 전문가가 아니므로 정확한 진단은 병원을 방문하여 의사와 상담하시는 것을 강력히 권장합니다.'라고 답변해야 해. " +
                "2. 답변은 항상 친절하고 긍정적인 톤을 유지해 줘. " +
                "3. 건강, 운동, 식단과 전혀 관련 없는 주제(예: 정치, 금융, 연예, 기술 등)에 대한 질문은 정중하게 거절해. '저는 건강 및 식단 전문 AI라서 해당 주제에 대해서는 답변하기 어려워요. 건강 관련 질문이 있으시면 언제든지 말씀해주세요!'와 같이 답변해. " +
                "4. 모든 답변은 2~3문단의 짧은 길이로 요약해서 제공해 줘.";

        OpenAiMessage systemMessage = new OpenAiMessage("system", healthSyncPrompt);
        // step 1-2. user 메세지 작성 - 실제 사용자의 질문
        OpenAiMessage userMessage = new OpenAiMessage("user", prompt);
        // step 1-3. 메세지 리스트에 system → user 순서로 담기
        List<OpenAiMessage> messages = List.of(systemMessage, userMessage);
        // step 1-4. 모델 이름과 메세지를 포함한 요청 객체 생성
        return new OpenAiRequest(model, messages);
    }
}
