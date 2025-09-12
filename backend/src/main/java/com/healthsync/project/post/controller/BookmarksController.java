package com.healthsync.project.post.controller;

import com.healthsync.project.post.domain.PostBookmark;
import com.healthsync.project.post.dto.bookmarksdto.BookmarkRequest;
import com.healthsync.project.post.dto.bookmarksdto.BookmarkResponse;
import com.healthsync.project.post.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class BookmarksController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{postId}/bookmarks")
    public ResponseEntity<Void> add(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId
    ) {
        bookmarkService.addBookmark(userId, postId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{postId}/bookmarks")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId
    ) {
        bookmarkService.removeBookmark(userId, postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/bookmarks/toggle")
    public ResponseEntity<Void> toggle(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @PathVariable Long postId
    ) {
        bookmarkService.toggleBookmark(userId, postId);
        return ResponseEntity.ok().build();
    }

//    @GetMapping("/me/bookmarks")
//    public Page<BookmarkResponse> myBookmarks(
//            @AuthenticationPrincipal com.healthsync.project.logintest.dto.LoginUser principal,
//            Pageable pageable
//    ) {
//        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
//        return bookmarkService.listMyBookmarksDto(principal.getId(), pageable);
//    }

}
