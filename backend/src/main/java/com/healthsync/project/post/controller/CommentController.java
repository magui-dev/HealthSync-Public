package com.healthsync.project.post.controller;

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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(userId, postId, request));
    }

    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable Long postId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(commentService.getComments(postId, pageable));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequest request
    ) {
        return ResponseEntity.ok(commentService.updateComment(userId, postId, commentId, request));
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        commentService.deleteComment(userId, postId, commentId);
    }
}
