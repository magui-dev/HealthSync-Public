package com.healthsync.project.post.controller;

import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.dto.commentdto.CommentCreateRequest;
import com.healthsync.project.post.dto.commentdto.CommentResponse;
import com.healthsync.project.post.dto.commentdto.CommentUpdateRequest;
import com.healthsync.project.post.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            Authentication auth,
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(userId, postId, request));
    }


    // 댓글 조회
    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            Authentication auth,
            @PathVariable Long postId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Long viewerId = null;
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
            try { viewerId = Long.parseLong(auth.getName()); } catch (NumberFormatException ignored) {}
        }
        return ResponseEntity.ok(commentService.getComments(postId, pageable, viewerId));
    }


    // 댓글 수정
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            Authentication auth,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequest request
    ) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(commentService.updateComment(userId, postId, commentId, request));
    }

    // 댓글 삭제
    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            Authentication auth,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        Long userId = getUserIdFromAuth(auth);
        commentService.deleteComment(userId, postId, commentId);
    }

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보를 찾을 수 없습니다.");
        }
        String userIdStr = auth.getName();
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보(ID)가 올바르지 않습니다.");
        }
    }
}


