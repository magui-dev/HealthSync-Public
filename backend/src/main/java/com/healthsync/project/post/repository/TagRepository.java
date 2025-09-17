package com.healthsync.project.post.repository;

import com.healthsync.project.post.domain.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByTagName(String tagName);

    // 자동완성 (사이즈 제한은 Service/Controller에서 pageable로 제어)
    @Query("select t from Tag t where lower(t.tagName) like lower(concat(:prefix, '%'))")
    List<Tag> findByPrefix(@Param("prefix") String prefix, Pageable pageable);

    // 인기 태그 (네이티브: 조인테이블 집계)
    @Query("""
      select t.tagName as tag, count(distinct p.id) as cnt
      from Post p
      join p.tag t
      where p.deleted = false
        and p.visibility = com.healthsync.project.post.constant.Visibility.PUBLIC
      group by t.tagName
      order by count(distinct p.id) desc, t.tagName asc
    """)
    List<Object[]> findPopularTags(Pageable pageable);

    default List<Object[]> findPopularTags(int limit) {
        int lim = Math.max(1, Math.min(limit, 100));
        return findPopularTags(PageRequest.of(0, lim));
    }

    @Query("""
      select distinct t.tagName
      from Post p
      join p.tag t
      where p.deleted = false
        and p.user.id = :userId
      order by t.tagName asc
    """)
    List<String> findDistinctTagNamesByUserId(@Param("userId") Long userId);

    @Query("""
      select t.tagName as tag, count(distinct p.id) as cnt
      from Post p
      join p.tag t
      where p.deleted = false
        and p.user.id = :userId
      group by t.tagName
      order by cnt desc, t.tagName asc
    """)
    List<Object[]> findMyTagsWithCounts(@Param("userId") Long userId);
}
