package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.constant.Visibility;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.Tag;
import com.healthsync.project.post.dto.postdto.PostCreateRequest;
import com.healthsync.project.post.dto.postdto.PostResponse;
import com.healthsync.project.post.dto.postdto.PostUpdateRequest;
import com.healthsync.project.post.repository.PostCommentRepository;
import com.healthsync.project.post.repository.PostRepository;
import com.healthsync.project.post.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    // 테스트 코드
    @Transactional
    public PostResponse createPost(Long userId, PostCreateRequest req) {
        requireLogin(userId);
        User author = userRepository.getReferenceById(userId);

        List<Tag> tags = upsertTags(req.getTags());

        Post post = Post.create(
                author,
                req.getTitle(),
                req.getContentTxt(),
                req.getContentJson(),
                req.isBlockComment(),
                req.getVisibility(),           // null → PUBLIC (도메인에서 처리)
                req.getGoalId(),
                req.getPostDate(),
                tags
        );

        Post saved = postRepository.save(post);
        return toResponse(saved, 0L);
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId, boolean increaseView) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));

        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }

        // 조회수 증가를 트랜잭션 분리/동시성 고려해서 별도 엔드포인트로 두는 것도 좋음
        if (increaseView) {
            // 간단 버전: 엔티티에서 증가
            // (대량 트래픽이면 repository.increment 쿼리로 처리)
            post.increaseViews();
        }

        return toResponse(post, 0L);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getPublicPosts(Pageable pageable) {
        return postRepository.findByDeletedFalseAndVisibility(Visibility.PUBLIC, pageable)
                .map(p -> toResponse(p, 0L));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPosts(Long userId, Pageable pageable) {
        requireLogin(userId);
        return postRepository.findByDeletedFalseAndUser_Id(userId, pageable)
                .map(p -> toResponse(p, 0L));
    }

    @Transactional
    public PostResponse updatePost(Long userId, Long postId, PostUpdateRequest req) {
        requireLogin(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));

        assertOwnerOrThrow(post, userId);

        List<Tag> tags = upsertTags(req.getTags());
        post.update(
                req.getTitle(),
                req.getContentTxt(),
                req.getContentJson(),
                req.isBlockComment(),
                req.getVisibility(),
                req.getGoalId(),
                req.getPostDate(),
                tags
        );

        return toResponse(post, 0L);
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        requireLogin(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        assertOwnerOrThrow(post, userId);
        post.softDelete();
    }

    /* =========================
     * Helpers
     * ========================= */
    private void requireLogin(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    private void assertOwnerOrThrow(Post post, Long userId) {
        Long authorId = post.getUser() != null ? post.getUser().getId() : null;
        if (authorId != null && !authorId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 처리할 수 있습니다.");
        }
    }

    private List<Tag> upsertTags(List<String> names) {
        if (names == null) return List.of();
        List<Tag> tags = new ArrayList<>();
        for (String t : names) {
            if (t == null || t.isBlank()) continue;
            Tag tag = tagRepository.findByTagName(t).orElseGet(() -> Tag.createFreeTag(t));
            tags.add(tag);
        }
        return tags;
    }

    @Transactional
    public void likePost(Long userId, Long postId) {
        requireLogin(userId);                 // 이미 있는 유틸 그대로 사용
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }
        post.like(); // 엔티티 카운터 증가 (트랜잭션 안에서 flush)
    }

    // 조회수 +1 (동시성 안전: JPQL UPDATE)
    @Transactional
    public void increasePostView(Long postId) {
        postRepository.increaseViews(postId);
    }

    // 좋아요 취소 (카운터 감소만; 사용자별 중복 방지는 스키마 변경이 필요)
    @Transactional
    public void unlikePost(Long userId, Long postId) {
        requireLogin(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }
        post.decreaseLikes(); // 1)에서 추가한 메서드
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId) {
        Post p = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (p.isDeleted()) throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        return toResponse(p, 0L); // bookmarksCount 미사용이면 0L
    }

    private PostResponse toResponse(Post p, long bookmarksCount) {
        // bookmarksCount는 필요 시 DTO에 필드 추가
        return PostResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .visibility(p.getVisibility())
                .title(p.getTitle())
                .contentTxt(p.getContentTxt())
                .contentJson(p.getContentJson())
                .likesCount(p.getLikesCount())
                .viewsCount(p.getViewsCount())
                .deleted(p.isDeleted())
                .goalId(p.getGoalId())
                .postDate(p.getPostDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .tags(p.getTag() == null ? List.of()
                        : p.getTag().stream().map(Tag::getTagName).collect(Collectors.toList()))
                .build();
    }

}