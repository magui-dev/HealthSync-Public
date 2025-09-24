package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.constant.Visibility;
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

    // ✅ (추가) 비공개/차단 접근 검사
    private void checkReadable(User viewer, Post post) {
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }
        // 비공개면 작성자만
        if (post.getVisibility() == Visibility.PRIVATE) {
            Long ownerId = post.getUser() != null ? post.getUser().getId() : null;
            Long viewerId = viewer != null ? viewer.getId() : null;
            if (ownerId == null || !ownerId.equals(viewerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 게시글입니다.");
            }
        }
    }

    private void checkCommentWritable(User writer, Post post) {
        checkReadable(writer, post); // 비공개 검사 포함
        if (post.isBlockComment()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 게시글은 댓글이 차단되었습니다.");
        }
    }

    public CommentResponse createComment(Long userId, Long postId, CommentCreateRequest req) {
        requireLogin(userId);

        User author = userRepository.getReferenceById(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "삭제된 게시글입니다.");
        }

        // ✅ 비공개/차단 검사
        checkCommentWritable(author, post);

        PostComment c = PostComment.create(author, post, req.getContent());
        PostComment saved = postCommentRepository.save(c);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Pageable pageable, Long viewerId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        User viewer = (viewerId != null) ? userRepository.getReferenceById(viewerId) : null;

        // ✅ 조회 시에도 비공개 검사
        checkReadable(viewer, post);


        return postCommentRepository.findByPost_IdAndDeletedFalse(postId, pageable)
                .map(this::toResponse);
    }

    public CommentResponse updateComment(Long userId, Long postId, Long commentId, CommentUpdateRequest req) {
        requireLogin(userId);

        PostComment c = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));

        // ✅ 댓글이 속한 게시글 접근 가능 여부 확인(비공개 방지)
        Post post = c.getPost();
        User actor = userRepository.getReferenceById(userId);
        checkReadable(actor, post);

        assertOwnerOrThrow(c, userId);
        c.update(req.getContent());
        return toResponse(c);
    }

    public void deleteComment(Long userId, Long postId, Long commentId) {
        requireLogin(userId);

        PostComment c = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));

        // ✅ 접근 가능 여부 확인
        Post post = c.getPost();
        User actor = userRepository.getReferenceById(userId);
        checkReadable(actor, post);

        assertOwnerOrThrow(c, userId);
        c.softDelete();
    }

    /* ========= Helpers ========= */
    private void requireLogin(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    private void assertOwnerOrThrow(PostComment c, Long userId) {
        Long ownerId = (c.getUser() == null) ? null : c.getUser().getId();
        String nick = null;

        if (ownerId != null && !ownerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 처리할 수 있습니다.");
        }
    }

    private CommentResponse toResponse(PostComment c) {
        Long uid = (c.getUser() != null) ? c.getUser().getId() : null;
        String nick = null;
        if (c.getUser() != null) {
            // User 엔티티의 닉네임 필드에 맞춰서
            // 예: getNickname() 혹은 getName()
            nick = c.getUser().getNickname(); // ← 여기만 실제 필드명에 맞춰 주세요
        }

        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPost().getId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .content(c.getContent())
                .deleted(c.isDeleted())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .authorNickname(nick)
                .build();
    }
}
