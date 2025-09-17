package com.healthsync.project.post.controller;

import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.dto.postlikedto.LikerResponse;
import com.healthsync.project.post.service.PostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostLikeController {

    private final PostLikeService postLikeService;
    private final UserRepository userRepository;

    // 좋아요 누른 사람 목록 (공개)
    @GetMapping("/{postId}/likes")
    public Page<LikerResponse> listLikers(@PathVariable Long postId,
                                          @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return postLikeService.listLikers(postId, pageable);
    }

    // 내가 좋아요 눌렀는지 (인증 필요)
    @GetMapping("/{postId}/mylike")
    public ResponseEntity<?> likedByMe(@PathVariable Long postId, Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(java.util.Map.of(
                "likedByMe", postLikeService.likedByMe(userId, postId)
        ));
    }

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String email = auth.getName(); // JwtAuthenticationFilter가 subject=email 로 설정
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 없음"))
                .getId();
    }
}
