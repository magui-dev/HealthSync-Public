package com.healthsync.project.post.dto.commentdto;

import lombok.*;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long userId;
    private Long postId;
    private String content;
    private boolean deleted;
    private Instant createdAt;
    private Instant updatedAt;
    // 댓글 닉네임 판단용 추가
    private String authorNickname;
    // (선택) 프런트 편의: 내 댓글 여부
    private boolean mine;
}
