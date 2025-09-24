package com.healthsync.project.account.user.domain;

import com.healthsync.project.account.user.constant.Provider;
import com.healthsync.project.account.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    /** 소셜 로그인 최초 진입 시 upsert (email 기준) */
    public User upsertSocial(String email, String name, Provider provider) {
        return userRepository.findByEmail(email)
                .map(existing -> {
                    // 이미 존재하는 경우 → 이름/프로바이더 업데이트
                    existing.setName(name);
                    existing.setProvider(provider);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    // 기본 닉네임 자동 생성 (name → email 앞부분 순)
                    String base = (name != null && !name.isBlank())
                            ? name
                            : (email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "user");
                    String nick = uniqueNickname(base);
                    User u = User.newSocial(email, name, nick);
                    u.setProvider(provider); // provider 포함해서 User 생성
                    return userRepository.save(u);
        });
    }

    /** 닉네임 변경(중복 방지) - ID 기준 */
    public User updateNicknameById(Long userId, String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("닉네임은 비어 있을 수 없습니다.");
        }

        User u = getById(userId);

        // 변경하지 않았다면 중복 검사도 하지 않고 그냥 반환
        if (u.getNickname().equals(nickname)) {
            return u;
        }

        // 다른 사람이 이미 쓰고 있는 닉네임이라면 예외
        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        u.changeNickname(nickname);
        return u;
    }

    @Transactional(readOnly = true)
    public User getById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("ID에 해당하는 사용자를 찾을 수 없습니다: " + userId));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow();
    }

    /** 중복 없을 때까지 뒤에 숫자 붙이기 */
    private String uniqueNickname(String base) {
        String nick = base;
        int seq = 1;
        while (userRepository.existsByNickname(nick)) {
            nick = base + seq++;
        }
        return nick;
    }
}
