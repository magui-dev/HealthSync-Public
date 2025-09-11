package com.healthsync.project.post.repository;

import com.healthsync.project.post.domain.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    Page<PostComment> findByPost_IdAndDeletedFalse(Long postId, Pageable pageable);
}

