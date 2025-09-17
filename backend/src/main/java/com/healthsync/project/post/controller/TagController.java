package com.healthsync.project.post.controller;

import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.dto.postdto.PostResponse;
import com.healthsync.project.post.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class TagController {

    private final TagService tagService;
    private final UserRepository userRepository;

    // 공개 글 태그 검색
    @GetMapping("/by-tag")
    public ResponseEntity<Page<PostResponse>> getPublicPostsByTag(
            @RequestParam(name = "tag", required = false) String tag,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        // tag가 없으면 빈 페이지 반환(또는 400 던지기)
        if (tag == null || tag.isBlank()) {
            return ResponseEntity.ok(Page.empty(pageable));
        }
        return ResponseEntity.ok(tagService.getPublicPostsByTag(tag, pageable));
    }

    /** 내 글 전체 테그 */
    @GetMapping("/mypost/tags")
    public ResponseEntity<List<String>> getMyTagNames(Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(tagService.getMyTagNames(userId));
    }

    @GetMapping("/mypost/tags/stats")
    public ResponseEntity<List<TagService.TagCountResponse>> getMyTagStats(Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        return ResponseEntity.ok(tagService.getMyTagStats(userId));
    }

    /** 태그 자동완성 */
    @GetMapping("/tags")
    public ResponseEntity<List<String>> autocomplete(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(tagService.autocompleteTags(query, size));
    }

    /** 인기 태그 Top-N */
    @GetMapping("/tags/popular")
    public ResponseEntity<List<TagService.TagCountResponse>> popular(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(tagService.popularTags(limit));
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
