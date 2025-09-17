package com.healthsync.project.post.repository;

import com.healthsync.project.post.constant.Visibility;
import com.healthsync.project.post.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByDeletedFalseAndVisibility(Visibility visibility, Pageable pageable);
    Page<Post> findByDeletedFalseAndUser_Id(Long userId, Pageable pageable);


    @Modifying
    @Query("update Post p set p.viewsCount = p.viewsCount + 1 where p.id = :postId")
    void increaseViews(@Param("postId") Long postId);

    // ✅ 일정 기간 지난 Soft Deleted 게시글 조회 (하드 삭제 대상)
    List<Post> findByDeletedTrueAndDeletedAtBefore(Instant threshold);

    // 공개 글 + 단일 태그 필터
    @Query("""
      select distinct p
      from Post p
      join p.tag t
      where p.deleted = false
        and p.visibility = com.healthsync.project.post.constant.Visibility.PUBLIC
        and t.tagName = :tagName
      """)
    Page<Post> findPublicByTag(@Param("tagName") String tagName, Pageable pageable);

    // (선택) 내 글 + 태그 필터
    @Query("""
      select distinct p
      from Post p
      join p.tag t
      where p.deleted = false
        and p.user.id = :userId
        and t.tagName = :tagName
      """)
    Page<Post> findMyPostsByTag(@Param("userId") Long userId, @Param("tagName") String tagName, Pageable pageable);

}
