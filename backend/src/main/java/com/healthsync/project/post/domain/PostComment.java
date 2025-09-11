package com.healthsync.project.post.domain;

import com.healthsync.project.account.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "post_comment")
public class PostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private long id;

    @ManyToOne(fetch = FetchType.LAZY) // user(user_id)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY) // post(post_id)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Lob
    @Column(name = "content")
    private String content;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /* ========= 팩토리 & 행위 ========= */

    public static PostComment create(User author, Post post, String content) {
        PostComment c = PostComment.builder()
                .user(author)
                .post(post)
                .content(content)
                .deleted(false)
                .build();
        return c;
    }

    public void update(String content) {
        this.content = content;
    }

    public void softDelete() {
        this.deleted = true;
    }

    // 필요한 경우에만 열어둔 세터
    public void setAuthor(User user) { this.user = user; }
    public void setPost(Post post) { this.post = post; }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.content == null) this.content = "";
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

}
