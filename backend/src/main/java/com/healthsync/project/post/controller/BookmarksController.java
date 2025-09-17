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
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보를 찾을 수 없습니다.");
        }
        // Principal을 문자열로 가져온다 (auth.getName()이 subject를 반환합니다)
        String userIdStr = auth.getName();

        // 문자열을 Long으로 파싱한다
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "인증 정보가 올바르지 않습니다 (ID가 숫자가 아님).");
        }
    }
}
