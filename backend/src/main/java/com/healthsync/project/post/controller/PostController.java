package com.healthsync.project.post.controller;

import com.healthsync.project.account.user.repository.UserRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    // 게시판 작성
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            Authentication auth,
            @Valid @RequestBody PostCreateRequest request) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(postService.createPost(userId, request));
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void increaseView(@PathVariable Long postId) {
        postService.increasePostView(postId);
    }

    // 좋아요 수만 확인하고 싶을 때
    @GetMapping("/{postId}/likes/count")
    public ResponseEntity<Integer> getLikesCount(@PathVariable Long postId) {
        PostResponse res = postService.getPost(postId);
        return ResponseEntity.ok(res.getLikesCount());
    }

    // 좋아요 증가
    @PostMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void like(@PathVariable Long postId, Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        postService.likePost(userId, postId);
    }

    // 좋아요 취소
    @DeleteMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlikePost(@PathVariable Long postId, Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        postService.unlikePost(userId, postId);
    }

    // 내가 쓴 글
    @GetMapping("/mypost")
    public ResponseEntity<Page<PostResponse>> getMyPosts(
            Authentication auth,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(postService.getMyPosts(userId, pageable));
    }

    // 게시판 수정
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            Authentication auth,
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request
    ) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(postService.updatePost(userId, postId, request));
    }

    // 게시판 삭제
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable Long postId, Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        postService.deletePost(userId, postId);
    }


    /** ✅ 공통 로직: Authentication에서 이메일 → userId 변환 */
    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String email = auth.getName(); // JWT subject = email
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 없음"))
                .getId();
    }

}
