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

@Service
@RequiredArgsConstructor
public class PostCleanupService {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;

    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    @Transactional
    public void purgeDeletedEntities() {
        Instant postThreshold = Instant.now().minus(10, ChronoUnit.DAYS);
        Instant commentThreshold = Instant.now().minus(10, ChronoUnit.DAYS);

        // ✅ 10일 지난 삭제된 게시글 하드 삭제
        List<Post> oldDeletedPosts = postRepository.findByDeletedTrueAndDeletedAtBefore(postThreshold);
        postRepository.deleteAll(oldDeletedPosts);

        // ✅ 10일 지난 삭제된 댓글 하드 삭제
        List<PostComment> oldDeletedComments = postCommentRepository.findByDeletedTrueAndDeletedAtBefore(commentThreshold);
        postCommentRepository.deleteAll(oldDeletedComments);
    }
}