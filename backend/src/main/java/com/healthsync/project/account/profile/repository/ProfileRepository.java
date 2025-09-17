package com.healthsync.project.account.profile.repository;

import com.healthsync.project.account.profile.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Profile 엔티티의 CRUD 기능을 제공하는 JPA Repository 인터페이스.
 */

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
}