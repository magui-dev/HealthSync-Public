package com.healthsync.project.post.service;

import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostComment;
import com.healthsync.project.post.repository.PostCommentRepository;
import com.healthsync.project.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;


// 게시글 삭제 후 DB에서 설정한 시간 뒤에 완전 삭제
@Service
@RequiredArgsConstructor
public class PostCleanupService {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;

    @Scheduled(cron = "0 * * * * *") //
    @Transactional
    public void purgeDeletedEntities() {
        Instant cutoff = Instant.now().minus(10, ChronoUnit.MINUTES);

        // 10분 지난 소프트삭제 게시글만 하드 삭제
        List<Post> oldDeletedPosts = postRepository.findByDeletedTrueAndDeletedAtBefore(cutoff);
        postRepository.deleteAll(oldDeletedPosts);
    }
}