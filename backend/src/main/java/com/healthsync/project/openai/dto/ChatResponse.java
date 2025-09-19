package com.healthsync.project.openai.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatResponse {
    private String answer;

    public static ChatResponse of(String answer) {
        return new ChatResponse(answer);
    }
}
