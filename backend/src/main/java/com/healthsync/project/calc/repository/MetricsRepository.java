package com.healthsync.project.calc.repository;

import com.healthsync.project.calc.domain.Metrics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Metrics 엔티티의 CRUD 기능을 제공하는 JPA Repository 인터페이스.
 */

public interface MetricsRepository extends JpaRepository<Metrics, Long> {
    // Profile의 PK가 userId이므로 연관 경로 profile.userId 를 타도록 네이밍
    Optional<Metrics> findTopByProfile_UserIdOrderByIdDesc(Long userId);
}