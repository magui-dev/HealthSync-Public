package com.healthsync.project.account.profile.history;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {
    List<WeightLog> findAllByUserIdOrderByRecordedAtDesc(Long userId);

    List<WeightLog> findAllByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc(
            Long userId, java.time.LocalDateTime start, java.time.LocalDateTime end
    );

    WeightLog findTopByUserIdOrderByRecordedAtDesc(Long userId);
}
