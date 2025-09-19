package com.healthsync.project.post.repository;

import com.healthsync.project.post.domain.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    Page<PostComment> findByPost_IdAndDeletedFalse(Long postId, Pageable pageable);


    @Modifying
    @Query("DELETE FROM PostComment c WHERE c.post.id = :postId")
    int hardDeleteByPostId(@Param("postId") Long postId);

    List<PostComment> findByDeletedTrueAndDeletedAtBefore(Instant cutoff);
}

