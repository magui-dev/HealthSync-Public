package com.healthsync.project.openai.repository;

import com.healthsync.project.openai.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {

    /**
     * 특정 사용자의 대화 히스토리를 시간순으로 조회
     */
    List<ChatHistory> findByUserIdOrderByCreatedAtAsc(Long userId);

    /**
     * 특정 사용자의 대화 히스토리 개수 조회
     */
    long countByUserId(Long userId);

    /**
     * 특정 사용자의 가장 오래된 N개 대화 조회 (요약용)
     */
    @Query("SELECT c FROM ChatHistory c WHERE c.userId = :userId ORDER BY c.createdAt ASC LIMIT :limit")
    List<ChatHistory> findOldestByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * 특정 사용자의 가장 오래된 N개 대화 삭제
     */
    @Modifying
    @Query("DELETE FROM ChatHistory c WHERE c.id IN " +
            "(SELECT c2.id FROM ChatHistory c2 WHERE c2.userId = :userId ORDER BY c2.createdAt ASC LIMIT :limit)")
    void deleteOldestByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * 특정 사용자의 전체 대화 히스토리 삭제
     */
    void deleteByUserId(Long userId);
}
