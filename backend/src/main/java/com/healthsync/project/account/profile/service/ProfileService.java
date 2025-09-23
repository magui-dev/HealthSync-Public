package com.healthsync.project.account.profile.service;

import com.healthsync.project.account.profile.domain.Profile;
import com.healthsync.project.account.profile.dto.ProfileRequest;
import com.healthsync.project.account.profile.dto.ProfileResponse;
import com.healthsync.project.account.profile.repository.ProfileRepository;
import com.healthsync.project.calc.dto.MetricsResponse;
import com.healthsync.project.calc.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    @Transactional
    public Profile updateProfile(Long userId, ProfileRequest dto) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로필입니다."));

        profile.updateProfile(dto); // DTO의 값으로 엔티티 업데이트

        // 트랜잭션 종료 시 변경 감지(Dirty Checking)를 통해 자동으로 DB에 반영
        return profile;
    }


    // GET/ 프로필 최신 정보 조회(읽기만).0922 추가
    // bmi,bmr 일단 프런트에서 계산, 나중에 수정
    @Transactional(readOnly = true)
    public ProfileResponse getProfileDtoByUserId(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로필입니다."));

        return new ProfileResponse(
                profile.getUserId(),
                profile.getAge(),
                profile.getGender(),
                profile.getHeight(),
                profile.getWeight(),
                profile.getActivityLevel(),
                profile.getUser().getNickname()
//                null,   // bmi: 프런트 계산
//                0.0     // bmr: 프런트 계산 (double은 null 불가라 임시 0.0)
        );
    }
}
