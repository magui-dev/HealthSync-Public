package com.healthsync.project.post.repository;

import com.healthsync.project.post.domain.PostBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    @EntityGraph(attributePaths = {"post", "user"})
    Page<PostBookmark> findByUser_Id(Long userId, Pageable pageable);

    boolean existsByUser_IdAndPost_Id(Long userId, Long postId);

    long countByPost_Id(Long postId);

    Optional<PostBookmark> findByUser_IdAndPost_Id(Long userId, Long postId);



}

