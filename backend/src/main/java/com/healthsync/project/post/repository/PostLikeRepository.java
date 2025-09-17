package com.healthsync.project.post.repository;

import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.post.domain.Post;
import com.healthsync.project.post.domain.PostLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByUser_IdAndPost_Id(Long userId, Long postId);

    long countByPost_Id(Long postId);

    @EntityGraph(attributePaths = {"user"})
    Page<PostLike> findByPost_Id(Long postId, Pageable pageable);

    @Query("select pl.user from PostLike pl where pl.post.id = :postId")
    Page<User> findLikersUsers(Long postId, Pageable pageable);

    Optional<PostLike> findByUser_IdAndPost_Id(Long userId, Long postId);

    @Query("SELECT pl.post FROM PostLike pl WHERE pl.user.id = :userId")
    Page<Post> findLikedPostsByUserId(@Param("userId") Long userId, Pageable pageable);
}
