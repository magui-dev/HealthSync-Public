package com.healthsync.project.post.domain;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.post.constant.Visibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "post")
public class Post {

    @Id
    @Column(name = "post_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // NULL 허용, 외부 도메인(FK)라 여기선 Long으로만 관리
    // NULL 허용시 래퍼 타입 권장
    @Column(name = "goal_id")
    private Long goalId;

    @Column(name = "title", length = 100, nullable = false)
    private String title;

    @Column(name = "is_block_comment", nullable = false)
    private boolean blockComment;

    @Lob
    @Column(name = "content_txt", nullable = false)
    private String contentTxt;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private Visibility visibility;

    @Column(name = "likes_count", nullable = false)
    private int likesCount;

    @Column(name = "is_delete", nullable = false)
    private boolean deleted;

    @Column(name = "views_count", nullable = false)
    private int viewsCount;

    @Column(name = "content_json", columnDefinition = "json")
    private String contentJson; // 옵션

    @Column(name = "post_date")
    private LocalDate postDate; // NULL 허용

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Tag> tag = new ArrayList<>();

    /* ---------- 생성/수정/행위 메서드 ---------- */

    public static Post create(
            User author,
            String title,
            String contentTxt,
            String contentJson,
            Boolean blockComment,     // null 허용 → 기본값 처리
            Visibility visibility,    // null → PUBLIC
            Long goalId,
            LocalDate postDate,
            List<Tag> tags
    ) {
        Post p = Post.builder()
                .user(author)
                .title(title)
                .contentTxt(contentTxt)
                .contentJson(contentJson)
                .blockComment(blockComment != null ? blockComment : false)
                .visibility(visibility != null ? visibility : Visibility.PUBLIC)
                .goalId(goalId)
                .postDate(postDate)
                .deleted(false)
                .likesCount(0)
                .viewsCount(0)
                .build();
        p.replaceTags(tags);
        return p;
    }

    public void update(
            String title,
            String contentTxt,
            String contentJson,
            Boolean blockComment,
            Visibility visibility,
            Long goalId,
            LocalDate postDate,
            List<Tag> tags
    ) {
        this.title = title;
        this.contentTxt = contentTxt;
        this.contentJson = contentJson;
        if (blockComment != null) this.blockComment = blockComment;
        if (visibility != null)   this.visibility = visibility;
        this.goalId = goalId;
        this.postDate = postDate;
        replaceTags(tags);
    }

    public void replaceTags(List<Tag> newTags) {
        this.tag.clear();
        if (newTags != null) this.tag.addAll(newTags);
    }

    public void softDelete() { this.deleted = true; }

    public void increaseViews() { this.viewsCount++; }

    public void decreaseLikes() {
        this.likesCount = Math.max(0, this.likesCount - 1);
    }

    public void like() { this.likesCount++; }

    public void setAuthor(User author) { this.user = author; }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.visibility == null) this.visibility = Visibility.PUBLIC;
        if (this.likesCount == 0) this.likesCount = 0;
        if (this.viewsCount == 0) this.viewsCount = 0;
        // deleted 기본 false는 생성 시점에 보장되어 있음
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
