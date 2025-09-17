package com.healthsync.project.account.profile.service;

import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.account.user.domain.User;
import com.healthsync.project.account.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Transactional
    public Profile updateProfile(Long userId, ProfileRequest dto) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로필입니다."));

        profile.updateProfile(dto); // DTO의 값으로 엔티티 업데이트

        // 트랜잭션 종료 시 변경 감지(Dirty Checking)를 통해 자동으로 DB에 반영
        return profile;
    }

}
