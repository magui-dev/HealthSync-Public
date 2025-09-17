package com.healthsync.project.account.user.repository;

import com.healthsync.project.account.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /** ✅ 닉네임 중복 체크용 */
    boolean existsByNickname(String nickname);

    /**
     * 목표설정 용 추가
     * 이메일로 PK(id)만 빠르게 가져오기 */
    @Query("select u.id from User u where u.email = :email")
    Optional<Long> findIdByEmail(@Param("email") String email);

    //  추가: 닉네임으로 PK(id)만 빠르게 조회 (닉네임 UNIQUE 전제)
    @Query("select u.id from User u where u.nickname = :nickname")
    Optional<Long> findIdByNickname(@Param("nickname") String nickname);
}
