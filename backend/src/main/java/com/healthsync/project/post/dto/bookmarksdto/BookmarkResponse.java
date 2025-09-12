package com.healthsync.project.post.dto.bookmarksdto;

import com.healthsync.project.post.domain.PostBookmark;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@NoArgsConstructor
public class BookmarkResponse {
    private Long bookmarkId;
    private Long postId;
    private String postTitle;
    private Long authorId;
    private Instant createdAt;

    // 생성자
    public BookmarkResponse(Long bookmarkId, Long postId, String postTitle,
                            Long authorId, Instant createdAt) {
        this.bookmarkId = bookmarkId;
        this.postId = postId;
        this.postTitle = postTitle;
        this.authorId = authorId;
        this.createdAt = createdAt;
    }

    // 엔티티 → DTO 변환
    public static BookmarkResponse from(PostBookmark bm) {
        return new BookmarkResponse(
                bm.getId(),
                bm.getPost().getId(),
                bm.getPost().getTitle(),
                bm.getUser().getId(),
                bm.getCreatedAt()
        );
    }}
