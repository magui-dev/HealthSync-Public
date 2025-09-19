package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.constant.Visibility;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostLike;
import com.healthsync.project.post.domain.Tag;
import com.healthsync.project.post.dto.postdto.PostCreateRequest;
import com.healthsync.project.post.dto.postdto.PostResponse;
import com.healthsync.project.post.dto.postdto.PostUpdateRequest;
import com.healthsync.project.post.repository.*;
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
    private final PostCommentRepository postCommentRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository likeRepository;
    private final PostBookmarkRepository bookmarkRepository;

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
// ✅ 1. 메서드 시그니처에 Long currentUserId 파라미터를 추가합니다.
    public PostResponse getPost(Long postId, boolean increaseView, Long currentUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));

        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }

        // ✅ 2. 기존 로직을 아래 코드로 교체합니다.
        if (post.getVisibility() == Visibility.PRIVATE) {
            // 비공개 글일 경우, 작성자의 ID와 현재 로그인한 사용자의 ID를 비교합니다.
            // currentUserId가 null이거나, 작성자 ID와 일치하지 않으면 접근을 차단합니다.
            if (currentUserId == null || !post.getUser().getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 게시글을 볼 권한이 없습니다.");
            }
        }

        if (increaseView) {
            post.increaseViews();
        }

        // toResponse 메서드에도 currentUserId를 넘겨주도록 수정합니다. (좋아요, 북마크 여부 등을 확인하기 위함)
        return toResponse(post, currentUserId);
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

    @Transactional(readOnly = true)
    public Page<PostResponse> getMyLikedPosts(Long userId, Pageable pageable) {
        requireLogin(userId);
        // PostLikeRepository를 사용하여 특정 사용자가 '좋아요'한 Post 목록을 가져옵니다.
        Page<Post> likedPostsPage = likeRepository.findLikedPostsByUserId(userId, pageable);

        // 각 Post 엔티티를 PostResponse DTO로 변환합니다.
        return likedPostsPage.map(post -> toResponse(post, userId));
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

        // 1) 댓글 하드 삭제 (FK 안전)
        postCommentRepository.hardDeleteByPostId(postId);
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
        requireLogin(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        User user = userRepository.getReferenceById(userId);

        // 이미 좋아요를 눌렀다면 아무것도 하지 않음
        if (likeRepository.existsByUser_IdAndPost_Id(userId, postId)) {
            return;
        }

        // PostLike 테이블에 '좋아요' 기록을 생성하고 저장
        PostLike like = new PostLike(null, post, user, Instant.now());
        likeRepository.save(like);

        // Post 엔티티의 카운터도 1 증가
        post.increaseLikes();
    }

    @Transactional
    public void unlikePost(Long userId, Long postId) {
        requireLogin(userId);

        // PostLike 테이블에서 '좋아요' 기록을 찾아서 삭제
        likeRepository.findByUser_IdAndPost_Id(userId, postId)
                .ifPresent(like -> {
                    Post post = like.getPost();
                    likeRepository.delete(like);
                    // Post 엔티티의 카운터도 1 감소
                    post.decreaseLikes();
                });
    }

    // 조회수 +1 (동시성 안전: JPQL UPDATE)
    @Transactional
    public void increasePostView(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.getVisibility() == Visibility.PRIVATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 게시글입니다.");
        }
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }
        postRepository.increaseViews(postId);
    }


    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId) {
        Post p = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (p.isDeleted()) throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        return toResponse(p, 0L); // bookmarksCount 미사용이면 0L
    }

    private void assertReadable(Post post, Long userId) {
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }
        if (post.getVisibility() == Visibility.PRIVATE) {
            if (userId == null || !post.getUser().getId().equals(userId)) {
                // 존재 은닉이 필요하면 FORBIDDEN 대신 NOT_FOUND 고려
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 게시글입니다.");
            }
        }
    }

    private PostResponse toResponse(Post p, Long currentUserId) {

        boolean isLiked = false;
        boolean isBookmarked = false;

        // 로그인한 사용자일 경우에만 좋아요/북마크 여부를 확인합니다.
        if (currentUserId != null) {
            isLiked = likeRepository.existsByUser_IdAndPost_Id(currentUserId, p.getId());
            isBookmarked = bookmarkRepository.existsByUser_IdAndPost_Id(currentUserId, p.getId());
        }

        String nickname = null;
        if (p.getUser() != null) {
            nickname = p.getUser().getNickname();
            if (nickname == null || nickname.isBlank()) {
                nickname = p.getUser().getName(); // 또는 "익명"
            }
        }

        return PostResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .authorNickname(nickname)
                .visibility(p.getVisibility())
                .title(p.getTitle())
                .contentTxt(p.getContentTxt())
                .contentJson(p.getContentJson())
                .blockComment(p.isBlockComment())
                .likesCount(p.getLikesCount())
                .viewsCount(p.getViewsCount())
                .deleted(p.isDeleted())
                .goalId(p.getGoalId())
                .postDate(p.getPostDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .tags(p.getTag() == null ? List.of()
                        : p.getTag().stream().map(Tag::getTagName).collect(Collectors.toList()))
                // ✅ 4. 방금 계산한 값을 DTO에 담아줍니다.
                .likedByMe(isLiked)
                .bookmarkedByMe(isBookmarked)
                .build();
    }
}