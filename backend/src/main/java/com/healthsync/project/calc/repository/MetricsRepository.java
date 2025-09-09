package com.healthsync.project.calc.repository;

import com.healthsync.project.calc.domain.Metrics;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CalcResult 엔티티의 CRUD 기능을 제공하는 JPA Repository 인터페이스.
 */

public interface MetricsRepository extends JpaRepository<Metrics, Long> { }