package com.healthsync.project.plan.repository;

import com.healthsync.project.plan.domain.GoalSummary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalSummaryRepository extends JpaRepository<GoalSummary, Long> {
}
