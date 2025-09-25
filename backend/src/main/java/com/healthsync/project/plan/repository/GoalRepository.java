package com.healthsync.project.plan.repository;

import com.healthsync.project.plan.domain.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    // ✅ 목록: 기존 서비스 list(userId)에서 쓰는 형태 (파라미터 1개)
    List<Goal> findAllByUserIdOrderByStartDateDesc(Long userId);

    // ✅ 업서트: 같은 시작일 + 같은 주차면 기존 목표 찾아서 덮어쓰기
    Optional<Goal> findByUserIdAndStartDateAndDuration_Weeks(Long userId, LocalDate startDate, int value);

    Optional<Goal> findByIdAndUserId(Long id, Long userId);
}
