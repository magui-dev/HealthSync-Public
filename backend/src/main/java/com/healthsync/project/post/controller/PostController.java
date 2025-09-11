package com.healthsync.project.post.controller;

import com.healthsync.project.post.domain.PostBookmark;
import com.healthsync.project.post.dto.postdto.PostCreateRequest;
import com.healthsync.project.post.dto.postdto.PostResponse;
import com.healthsync.project.post.dto.postdto.PostUpdateRequest;
import com.healthsync.project.post.service.BookmarkService;
import com.healthsync.project.post.service.PostService;
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
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;

    // 게시판 작성
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @Valid @RequestBody PostCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(userId, request));
    }

    // 게시판 불러오기
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long postId,
            @RequestParam(name = "increaseView", defaultValue = "false") boolean increaseView
    ) {
        return ResponseEntity.ok(postService.getPost(postId, increaseView));
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getPublicPosts(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(postService.getPublicPosts(pageable));
    }

    // 조회수 만 확인하고 싶을때
    @GetMapping("/{postId}/views/count")
    public ResponseEntity<Integer> getViewsCount(@PathVariable Long postId) {
        PostResponse res = postService.getPost(postId);
        return ResponseEntity.ok(res.getViewsCount());
    }

    // 조회수 +1
    @PostMapping("/{postId}/views/increase")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204
    public void increaseView(@PathVariable Long postId) {
        postService.increasePostView(postId);
    }

    // 좋아요 수만 확인하고 싶을 때
    @GetMapping("/{postId}/likes/count")
    public ResponseEntity<Integer> getLikesCount(@PathVariable Long postId) {
        PostResponse res = postService.getPost(postId); // 서비스에 상세 응답 메서드가 있으면 재사용
        return ResponseEntity.ok(res.getLikesCount());
    }

    // 좋아요 증가
    @PostMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204
    public void like(@PathVariable Long postId,
                     @AuthenticationPrincipal(expression = "id") Long userId) {
        postService.likePost(userId, postId);
    }

    // 좋아요 취소
    @DeleteMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204
    public void unlikePost(@PathVariable Long postId,
                           @AuthenticationPrincipal(expression = "id") Long userId) {
        postService.unlikePost(userId, postId);
    }

    // 작성 게시판
    @GetMapping("/mypost")
    public ResponseEntity<Page<PostResponse>> getMyPosts(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(postService.getMyPosts(userId, pageable));
    }

    // 게시판 수정
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request
    ) {
        return ResponseEntity.ok(postService.updatePost(userId, postId, request));
    }

    // 게시판 삭제
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId
    ) {
        postService.deletePost(userId, postId);
    }




}
