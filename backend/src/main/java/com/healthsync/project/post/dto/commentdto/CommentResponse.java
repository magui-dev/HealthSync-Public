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
}
