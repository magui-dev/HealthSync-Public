package com.healthsync.project.post.controller;

import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.domain.PostBookmark;
import com.healthsync.project.post.dto.bookmarksdto.BookmarkRequest;
import com.healthsync.project.post.dto.bookmarksdto.BookmarkResponse;
import com.healthsync.project.post.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class BookmarksController {

    private final BookmarkService bookmarkService;
    private final UserRepository userRepository;

    // 북마크 추가
    @PostMapping("/{postId}/bookmarks")
    public ResponseEntity<Void> add(
            Authentication auth,
            @PathVariable Long postId
    ) {
        Long userId = getUserIdFromAuth(auth);
        bookmarkService.addBookmark(userId, postId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 북마크 제거
    @DeleteMapping("/{postId}/bookmarks")
    public ResponseEntity<Void> remove(
            Authentication auth,
            @PathVariable Long postId
    ) {
        Long userId = getUserIdFromAuth(auth);
        bookmarkService.removeBookmark(userId, postId);
        return ResponseEntity.noContent().build();
    }

    // 북마크 토글
    @PostMapping("/{postId}/bookmarks/toggle")
    public ResponseEntity<Void> toggle(
            Authentication auth,
            @PathVariable Long postId
    ) {
        Long userId = getUserIdFromAuth(auth);
        bookmarkService.toggleBookmark(userId, postId);
        return ResponseEntity.ok().build();
    }

    // 내가 북마크한 게시글 목록
    @GetMapping("/me/bookmarks")
    public Page<BookmarkResponse> myBookmarks(
            Authentication auth,
            Pageable pageable
    ) {
        Long userId = getUserIdFromAuth(auth);
        return bookmarkService.listMyBookmarksDto(userId, pageable);
    }

    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        // ✅ JwtAuthenticationFilter가 Principal을 무엇으로 넣든지 간에 일관 동작
        String email = auth.getName(); // subject=email 로 세팅되어 있음

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 없음"))
                .getId();
    }
}
