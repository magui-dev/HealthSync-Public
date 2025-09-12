package com.healthsync.project.account.user.domain;

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
    public User upsertSocial(String email, String name) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            // 기본 닉네임 자동 생성 (name → email 앞부분 순)
            String base = (name != null && !name.isBlank())
                    ? name
                    : (email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "user");
            String nick = uniqueNickname(base);
            User u = User.newSocial(email, name, nick);
            return userRepository.save(u);
        });
    }

    /** 닉네임 변경(중복 방지) */
    public User updateNicknameByEmail(String email, String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("empty nickname");
        }
        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("nickname taken");
        }
        User u = userRepository.findByEmail(email).orElseThrow();
        u.changeNickname(nickname);
        return userRepository.save(u);
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
