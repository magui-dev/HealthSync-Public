package com.healthsync.project.calc.repository;

import com.healthsync.project.calc.domain.CalcProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * CalcProfile 엔티티의 CRUD 기능을 제공하는 JPA Repository 인터페이스.
 */

public interface CalcProfileRepository extends JpaRepository<CalcProfile, Long> {
    Optional<CalcProfile> findByEmail(String email);
}