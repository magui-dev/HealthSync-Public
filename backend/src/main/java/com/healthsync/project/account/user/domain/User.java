package com.healthsync.project.account.user.domain;

import com.healthsync.project.account.profile.domain.Profile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users", indexes = {
        @Index(name = "ux_users_email", columnList = "email", unique = true),
        @Index(name = "ux_users_nickname", columnList = "nickname", unique = true) // ✅ 닉네임 유니크
})
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소셜도 이메일 사용(프로바이더에서 반드시 email scope 동의 받는 전제) */
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /** 로컬 회원만 사용, 소셜 유저는 null */
    @Column(name = "password_hash")
    private String passwordHash;

    /** 프로바이더 제공 이름(원본 이름) */
    @Column(name = "name")
    private String name;

    /** 화면 표시용 닉네임(사용자 지정), 유니크 */
    @Column(name = "nickname", unique = true)
    private String nickname;

    /** 닉네임이 사용자가 직접 설정했는지 여부(기본 false: 자동생성 상태) */
    @Column(name = "nickname_set", nullable = false)
    private boolean nicknameSet = false;

    @Column(name = "roles", nullable = false)
    private String roles = "USER";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createAt;

    @PrePersist
    void prePersist() {
        if (createAt == null) createAt = LocalDateTime.now();
    }

    /** User와 1:1 관계 명시 */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Profile profile;



    // ===== 정적 팩토리 =====

    /** 로컬 가입용 (지금은 사용 안 함) */
    public static User newLocal(String email, String encodedPw, String name) {
        User u = new User();
        u.email = email;
        u.passwordHash = encodedPw;
        u.name = name;
        return u;
    }

    /** ✅ 소셜 로그인 최초 진입 시 생성용 */
    public static User newSocial(String email, String name, String nickname) {
        User u = new User();
        u.email = email;
        u.passwordHash = null;
        u.name = name;
        u.nickname = nickname;     // 자동 생성 닉네임
        u.nicknameSet = false;     // 아직 사용자가 직접 설정 전

        u.addProfile(Profile.createInitProfileSetting());

        return u;
    }

    // ===== 변경 메서드 =====

    public void changeNickname(String nickname) {
        this.nickname = nickname;
        this.nicknameSet = true;
    }

    public void addProfile(Profile profile) {
        this.profile = profile; // User가 Profile 참조
        profile.setUser(this);  // Profile이 User 참조
    }
}
