package com.healthsync.project.post.service;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostLike;
import com.healthsync.project.post.dto.postlikedto.LikerResponse;
import com.healthsync.project.post.repository.PostLikeRepository;
import com.healthsync.project.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PostLikeService {

    private final PostLikeRepository likeRepo;

    @Transactional(readOnly = true)
    public long countLikes(Long postId) {
        return likeRepo.countByPost_Id(postId);
    }

    @Transactional(readOnly = true)
    public boolean likedByMe(Long currentUserId, Long postId) {
        if (currentUserId == null) return false;
        return likeRepo.existsByUser_IdAndPost_Id(currentUserId, postId);
    }

    @Transactional(readOnly = true)
    public Page<LikerResponse> listLikers(Long postId, Pageable pageable) {
        var usersPage = likeRepo.findLikersUsers(postId, pageable);
        return usersPage.map(u ->
                LikerResponse.builder()
                        .nickname(u.getNickname()) // 닉네임만 담음
                        .build()
        );
    }
}
