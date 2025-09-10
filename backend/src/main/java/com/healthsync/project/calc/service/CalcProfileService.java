package com.healthsync.project.calc.service;

import com.healthsync.project.calc.domain.CalcProfile;
import com.healthsync.project.calc.dto.CalcProfileRequest;
import com.healthsync.project.calc.repository.CalcProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CalcProfileService {

    private final CalcProfileRepository profileRepository;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$");

    /**
     * CalcProfileRequest DTO를 기반으로 CalcProfile Entity를 생성하고 DB에 저장합니다.
     * <p>
     * 저장 전 다음 검증을 수행합니다:
     * <ul>
     *     <li>이메일 형식 검증 (예: abc@def.com)</li>
     *     <li>이메일 중복 여부 확인</li>
     * </ul>
     * <p>
     * 검증 실패 시 IllegalArgumentException이 발생하며, 컨트롤러에서 400 Bad Request로 처리할 수 있습니다.
     *
     * @param request CalcProfileRequest : 클라이언트로부터 전달받은 프로필 정보
     * @return 저장된 CalcProfile 엔티티
     * @throws IllegalArgumentException 이메일 형식이 유효하지 않거나 이미 존재하는 경우
     */
    public CalcProfile createAndSaveCalcProfile(CalcProfileRequest request) {
        String email = request.getEmail();

        // 이메일 형식 체크
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("유효하지 않은 이메일 형식입니다.(예: abc@def.com)");
        }

        // 이메일 중복 체크
        profileRepository.findByEmail(email)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + email);
                });

        // DTO -> Entity 변환 후 저장
        CalcProfile ProfileEntity = CalcProfile.builder()
                .email(email)
                .name(request.getName())
                .birth(request.getBirth())
                .height(request.getHeight())
                .weight(request.getWeight())
                .gender(request.getGender())
                .level(request.getLevel())
                .build();

        return profileRepository.save(ProfileEntity);
    }
}