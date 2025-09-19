package com.healthsync.project.openai.dto;

import com.theokanning.openai.Usage;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OpenAiResponse {

    // GPT가 생성한 응답 선택지 리스트
    private List<Choice> choices;

    private Usage usage;              // ← 추가

    @Getter
    public static class Choice {
        // 생성된 메세지 정보
        private OpenAiMessage message;
    }

    @Getter
    public static class Usage {       // ← 추가
        private int prompt_tokens;
        private int completion_tokens;
        private int total_tokens;

        public int getTotalTokens() { return total_tokens; } // 편의용
    }

}
/**
OpenAI의 응답은 크게 3가지 필드로 구성됩니다.

choices - 생성된 GPT 응답
usage - 토큰 사용량 정보
메타 정보 - 응답 ID, 모델명 등

 */