package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostBookmark;
import com.healthsync.project.post.dto.bookmarksdto.BookmarkResponse;
import com.healthsync.project.post.repository.PostBookmarkRepository;
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
public class BookmarkService {

    private final PostBookmarkRepository bookmarkRepo;
    private final PostRepository postRepo;
    private final UserRepository userRepo; // 실제 경로에 맞게

    public void addBookmark(Long userId, Long postId) {
        requireLogin(userId);
        if (bookmarkRepo.existsByUser_IdAndPost_Id(userId, postId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 북마크한 글입니다.");
        }
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        User user = userRepo.getReferenceById(userId);

        PostBookmark bm = PostBookmark.builder()
                .post(post)
                .user(user)
                .createdAt(Instant.now())
                .build();
        bookmarkRepo.save(bm);
    }

    public void removeBookmark(Long userId, Long postId) {
        requireLogin(userId);
        bookmarkRepo.findByUser_IdAndPost_Id(userId, postId) // 없으면 아래 메서드 하나 더 추가해도 됨
                .ifPresentOrElse(
                        bookmarkRepo::delete,
                        () -> { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "북마크가 없습니다."); }
                );
    }

    public void toggleBookmark(Long userId, Long postId) {
        if (bookmarkRepo.existsByUser_IdAndPost_Id(userId, postId)) {
            removeBookmark(userId, postId);
        } else {
            addBookmark(userId, postId);
        }
    }

    @Transactional(readOnly = true)
    public Page<BookmarkResponse> listMyBookmarksDto(Long userId, Pageable pageable) {
        requireLogin(userId);
        return bookmarkRepo.findByUser_Id(userId, pageable)
                .map(BookmarkResponse::from); // 트랜잭션 안 + post/user 이미 로딩됨
    }

    @Transactional(readOnly = true)
    public long countBookmarks(Long postId) {
        return bookmarkRepo.countByPost_Id(postId);
    }

    @Transactional(readOnly = true)
    public Page<PostBookmark> listMyBookmarks(Long userId, Pageable pageable) {
        requireLogin(userId);
        return bookmarkRepo.findByUser_Id(userId, pageable);
    }

    private void requireLogin(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }
}
