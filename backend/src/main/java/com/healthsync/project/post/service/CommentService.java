package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostComment;
import com.healthsync.project.post.dto.commentdto.CommentCreateRequest;
import com.healthsync.project.post.dto.commentdto.CommentResponse;
import com.healthsync.project.post.dto.commentdto.CommentUpdateRequest;
import com.healthsync.project.post.repository.PostCommentRepository;
import com.healthsync.project.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;

    // 테스트 코드
    public CommentResponse createComment(Long userId, Long postId, CommentCreateRequest req) {
        requireLogin(userId);

        User author = userRepository.getReferenceById(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }

        PostComment c = PostComment.create(author, post, req.getContent());
        PostComment saved = postCommentRepository.save(c);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Pageable pageable) {
        return postCommentRepository.findByPost_IdAndDeletedFalse(postId, pageable)
                .map(this::toResponse);
    }

    public CommentResponse updateComment(Long userId, Long postId, Long commentId, CommentUpdateRequest req) {
        requireLogin(userId);

        PostComment c = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));
        assertOwnerOrThrow(c, userId);

        c.update(req.getContent());
        return toResponse(c);
    }

    public void deleteComment(Long userId, Long postId, Long commentId) {
        requireLogin(userId);

        PostComment c = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));
        assertOwnerOrThrow(c, userId);

        c.softDelete();
    }

    /* ========= Helpers ========= */
    private void requireLogin(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    private void assertOwnerOrThrow(PostComment c, Long userId) {
        Long ownerId = (c.getUser() == null) ? null : c.getUser().getId();
        if (ownerId != null && !ownerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 처리할 수 있습니다.");
        }
    }

    private CommentResponse toResponse(PostComment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPost().getId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .content(c.getContent())
                .deleted(c.isDeleted())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }



//    public CommentResponse createComment(Long userId, Long postId, CommentCreateRequest req) {
//        requireLogin(userId);
//        Post post = postRepository.findById(postId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
//
//        PostComment c = new PostComment();
//        // User 의존성 회피(모듈 분리 가정): 리플렉션으로 id만 세팅
//        try {
//            Class<?> userClass = Class.forName("com.healthsync.project.account.user.domain.User");
//            Object user = userClass.getDeclaredConstructor().newInstance();
//            userClass.getMethod("setId", Long.class).invoke(user, userId);
//            PostComment.class.getMethod("setUser", userClass).invoke(c, user);
//        } catch (Exception ignored) {}
//
//        c.setPost(post);
//        c.setContent(req.getContent());
//        c.setDeleted(false);
//        c.setCreatedAt(Instant.now());
//        c.setUpdatedAt(Instant.now());
//
//        PostComment saved = postCommentRepository.save(c);
//        return toResponse(saved);
//    }
//
//    @Transactional(readOnly = true)
//    public Page<CommentResponse> getComments(Long postId, Pageable pageable) {
//        return postCommentRepository.findByPost_IdAndDeletedFalse(postId, pageable)
//                .map(this::toResponse);
//    }
//
//    public CommentResponse updateComment(Long userId, Long postId, Long commentId, CommentUpdateRequest req) {
//        requireLogin(userId);
//        PostComment c = postCommentRepository.findById(commentId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));
//
//        Long ownerId = getUserIdFromComment(c);
//        if (ownerId != null && !ownerId.equals(userId)) {
//            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 수정할 수 있습니다.");
//        }
//        c.setContent(req.getContent());
//        c.setUpdatedAt(Instant.now());
//        return toResponse(c);
//    }
//
//    public void deleteComment(Long userId, Long postId, Long commentId) {
//        requireLogin(userId);
//        PostComment c = postCommentRepository.findById(commentId)
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));
//
//        Long ownerId = getUserIdFromComment(c);
//        if (ownerId != null && !ownerId.equals(userId)) {
//            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 삭제할 수 있습니다.");
//        }
//        c.setDeleted(true);
//        c.setUpdatedAt(Instant.now());
//    }
//
//    /* ========= Helpers ========= */
//    private void requireLogin(Long userId) {
//        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
//    }
//
//    private Long getUserIdFromComment(PostComment c) {
//        try {
//            Object user = PostComment.class.getMethod("getUser").invoke(c);
//            if (user != null) return (Long) user.getClass().getMethod("getId").invoke(user);
//        } catch (Exception ignored) {}
//        return null;
//    }
//
//    private CommentResponse toResponse(PostComment c) {
//        CommentResponse.CommentResponseBuilder b = CommentResponse.builder()
//                .id(c.getId())
//                .postId(c.getPost().getId())
//                .content(c.getContent())
//                .deleted(c.isDeleted())
//                .createdAt(c.getCreatedAt())
//                .updatedAt(c.getUpdatedAt());
//        Long uid = getUserIdFromComment(c);
//        if (uid != null) b.userId(uid);
//        return b.build();
//    }
}
