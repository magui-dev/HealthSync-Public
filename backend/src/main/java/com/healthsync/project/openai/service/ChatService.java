package com.healthsync.project.openai.service;

import com.healthsync.project.openai.dto.ChatRequest;
import com.healthsync.project.openai.dto.OpenAiMessage;
import com.healthsync.project.openai.dto.OpenAiResponse;
import com.healthsync.project.openai.dto.ReportContextDto;
import com.healthsync.project.openai.entity.ChatHistory;
import com.healthsync.project.openai.entity.ChatSummary;
import com.healthsync.project.openai.repository.ChatHistoryRepository;
import com.healthsync.project.openai.repository.ChatSummaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final OpenAiClient openAiClient;
    private final ChatHistoryRepository chatHistoryRepository;
    private final ChatSummaryRepository chatSummaryRepository;

    private static final int MAX_HISTORY_SIZE = 15;
    private static final int SUMMARIZE_COUNT = 5;

    /**
     * 클라이언트 질문을 받아 OpenAI 응답 텍스트 반환
     */
    @Transactional
    public String getAnswer(Long userId, ChatRequest chatRequest) {
        // 1. 오래된 요약 자동 정리 (오늘 날짜가 아닌 것 삭제)
        cleanupOldSummaries(userId);

        // 2. 프론트에서 받은 컨텍스트 데이터 DTO를 가져옵니다.
        ReportContextDto contextDto = chatRequest.getReportContext();
        String userContext = (contextDto != null) ? buildUserContext(contextDto) : null;

        // 3. 대화 히스토리 조회 (오늘 요약 + 현재 히스토리)
        List<OpenAiMessage> conversationHistory = buildConversationHistory(userId);

        // 4. 현재 사용자 질문을 히스토리에 저장
        saveUserMessage(userId, chatRequest.getMessage());

        // 5. OpenAI API 호출 (컨텍스트 + 히스토리 + 현재 질문)
        log.info("Request from User ID: {}, Question: {}", userId, chatRequest.getMessage());
        OpenAiResponse openAiResponse = openAiClient.getChatCompletionWithHistory(
                userContext,
                conversationHistory,
                chatRequest.getMessage()
        );

        String assistantAnswer = openAiResponse.getChoices().get(0).getMessage().getContent();

        // 6. AI 응답도 히스토리에 저장
        saveAssistantMessage(userId, assistantAnswer);

        // 7. 히스토리가 15개 이상이면 요약 수행
        checkAndSummarize(userId);

        return assistantAnswer;
    }

    /**
     * 오래된 요약 정리 (오늘 날짜가 아닌 요약 삭제)
     */
    private void cleanupOldSummaries(Long userId) {
        chatSummaryRepository.deleteOldSummaries(userId, LocalDate.now());
        log.debug("Cleaned up old summaries for user: {}", userId);
    }

    /**
     * 대화 히스토리 빌드 (요약 + 실시간 히스토리)
     */
    private List<OpenAiMessage> buildConversationHistory(Long userId) {
        List<OpenAiMessage> history = new ArrayList<>();

        // 1. 오늘 요약들 추가
        List<ChatSummary> todaySummaries = chatSummaryRepository
                .findByUserIdAndSummaryDate(userId, LocalDate.now());
        for (ChatSummary summary : todaySummaries) {
            // 요약은 system 메시지로 추가
            history.add(new OpenAiMessage("system", "[이전 대화 요약] " + summary.getSummaryData()));
        }

        // 2. 현재 히스토리 추가
        List<ChatHistory> chatHistories = chatHistoryRepository.findByUserIdOrderByCreatedAtAsc(userId);
        for (ChatHistory chat : chatHistories) {
            history.add(new OpenAiMessage(chat.getRole(), chat.getContent()));
        }

        return history;
    }

    /**
     * 사용자 메시지 저장
     */
    private void saveUserMessage(Long userId, String message) {
        ChatHistory userChat = ChatHistory.of(userId, "user", message);
        chatHistoryRepository.save(userChat);
    }

    /**
     * AI 응답 저장
     */
    private void saveAssistantMessage(Long userId, String message) {
        ChatHistory assistantChat = ChatHistory.of(userId, "assistant", message);
        chatHistoryRepository.save(assistantChat);
    }

    /**
     * 히스토리 15개 이상이면 가장 오래된 5개 요약 후 삭제
     */
    private void checkAndSummarize(Long userId) {
        long historyCount = chatHistoryRepository.countByUserId(userId);

        if (historyCount >= MAX_HISTORY_SIZE) {
            log.info("History count {} >= {}, starting summarization for user: {}", 
                    historyCount, MAX_HISTORY_SIZE, userId);

            // 가장 오래된 5개 조회
            List<ChatHistory> oldestChats = chatHistoryRepository.findOldestByUserId(userId, SUMMARIZE_COUNT);

            if (oldestChats.size() >= SUMMARIZE_COUNT) {
                // 요약 생성
                String summaryContent = createSummary(oldestChats);

                // 요약 저장
                ChatSummary chatSummary = ChatSummary.of(userId, summaryContent, SUMMARIZE_COUNT);
                chatSummaryRepository.save(chatSummary);
                log.info("Created summary: {} for user: {}", chatSummary.getId(), userId);

                // 오래된 5개 삭제
                chatHistoryRepository.deleteOldestByUserId(userId, SUMMARIZE_COUNT);
                log.info("Deleted oldest {} messages for user: {}", SUMMARIZE_COUNT, userId);
            }
        }
    }

    /**
     * 대화 내용을 요약 텍스트로 변환
     */
    private String createSummary(List<ChatHistory> chats) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음은 이전 대화의 요약입니다:\n");
        for (ChatHistory chat : chats) {
            String roleKr = "user".equals(chat.getRole()) ? "사용자" : "AI";
            sb.append(String.format("- %s: %s\n", roleKr, truncate(chat.getContent(), 100)));
        }
        return sb.toString();
    }

    /**
     * 문자열 자르기 (너무 긴 내용 방지)
     */
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    /**
     * 사용자 정보를 AI가 이해하기 쉬운 텍스트로 변환하는 헬퍼 메소드
     */
    private String buildUserContext(ReportContextDto dto) {
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
