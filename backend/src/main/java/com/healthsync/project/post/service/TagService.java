package com.healthsync.project.post.service;

import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.Tag;
import com.healthsync.project.post.dto.postdto.PostResponse;
import com.healthsync.project.post.repository.PostRepository;
import com.healthsync.project.post.repository.TagRepository;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final PostRepository postRepository;


    @Transactional(readOnly = true)
    public Page<PostResponse> getPublicPostsByTag(String tagName, Pageable pageable) {
        Page<Post> page = postRepository.findPublicByTag(tagName, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPostsByTag(Long userId, String tagName, Pageable pageable) {
        Page<Post> page = postRepository.findMyPostsByTag(userId, tagName, pageable);
        return page.map(this::toResponse);
    }

    // TagService.java
    @Transactional(readOnly = true)
    public List<String> getMyTagNames(Long userId) {
        requireLogin(userId);
        return tagRepository.findDistinctTagNamesByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<TagCountResponse> getMyTagStats(Long userId) {
        requireLogin(userId);
        return tagRepository.findMyTagsWithCounts(userId).stream()
                .map(row -> new TagCountResponse((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }

    private void requireLogin(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    @Transactional(readOnly = true)
    public List<String> autocompleteTags(String query, int size) {
        Pageable limit = PageRequest.of(0, Math.max(1, Math.min(size, 50)));
        return tagRepository.findByPrefix(query, limit).stream()
                .map(Tag::getTagName)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TagCountResponse> popularTags(int limit) {
        int lim = Math.max(1, Math.min(limit, 100));
        return tagRepository.findPopularTags(lim).stream()
                .map(row -> new TagCountResponse(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();
    }

    /* ---- mapper ---- */
    private PostResponse toResponse(Post p) {
        return PostResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .visibility(p.getVisibility())
                .title(p.getTitle())
                .contentTxt(p.getContentTxt())
                .contentJson(p.getContentJson())
                .likesCount(p.getLikesCount())
                .viewsCount(p.getViewsCount())
                .deleted(p.isDeleted())
                .goalId(p.getGoalId())
                .postDate(p.getPostDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .tags(p.getTag() == null ? List.of()
                        : p.getTag().stream().map(Tag::getTagName).toList())
                .build();
    }

    @Getter
    @AllArgsConstructor
    public static class TagCountResponse {
        private String tag;
        private long count;
    }

}

