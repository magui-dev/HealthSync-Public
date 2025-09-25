package com.healthsync.project.plan.repository;

import com.healthsync.project.plan.domain.GoalMetrics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoalMetricsRepository extends JpaRepository<GoalMetrics, Long> {
    Optional<GoalMetrics> findByGoalId(Long goalId);
}
