package com.healthsync.project.account.user.repository;

import com.healthsync.project.account.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /** ✅ 닉네임 중복 체크용 */
    boolean existsByNickname(String nickname);
}
