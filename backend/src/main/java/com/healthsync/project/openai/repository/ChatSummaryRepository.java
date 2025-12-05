package com.healthsync.project.openai.repository;

import com.healthsync.project.openai.entity.ChatSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ChatSummaryRepository extends JpaRepository<ChatSummary, String> {

    /**
     * 특정 사용자의 모든 요약 조회
     */
    List<ChatSummary> findByUserIdOrderBySummaryDateAsc(Long userId);

    /**
     * 특정 사용자의 오늘 날짜 요약만 조회
     */
    List<ChatSummary> findByUserIdAndSummaryDate(Long userId, LocalDate summaryDate);

    /**
     * 특정 사용자의 오늘이 아닌 요약 삭제 (자동 정리)
     */
    @Modifying
    @Query("DELETE FROM ChatSummary c WHERE c.userId = :userId AND c.summaryDate <> :today")
    void deleteOldSummaries(@Param("userId") Long userId, @Param("today") LocalDate today);

    /**
     * 특정 사용자의 전체 요약 삭제
     */
    void deleteByUserId(Long userId);
}
