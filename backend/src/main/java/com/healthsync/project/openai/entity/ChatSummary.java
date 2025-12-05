package com.healthsync.project.openai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "chat_summary")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatSummary {

    @Id
    @Column(length = 60)
    private String id; // UUID_YYYY-MM-DD 형태

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summaryData; // 요약된 대화 내용

    @Column(nullable = false)
    private LocalDate summaryDate;

    @Column(nullable = false)
    private Integer messageCount; // 요약된 메시지 개수

    public static ChatSummary of(Long userId, String summaryData, int messageCount) {
        String id = UUID.randomUUID().toString() + "_" + LocalDate.now();
        return ChatSummary.builder()
                .id(id)
                .userId(userId)
                .summaryData(summaryData)
                .summaryDate(LocalDate.now())
                .messageCount(messageCount)
                .build();
    }
}
