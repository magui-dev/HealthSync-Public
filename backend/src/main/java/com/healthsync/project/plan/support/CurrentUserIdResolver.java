package com.healthsync.project.plan.support;

import com.healthsync.project.account.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CurrentUserIdResolver {

    private final UserRepository userRepository;

    /** 보안 컨텍스트에서 email → 실패 시 nickname 으로 users.id 조회 */
    public Long requireCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }

        // 1) 이메일 시도
        String email = resolveEmail(auth);
        if (has(email)) {
            Optional<Long> id = userRepository.findIdByEmail(email);
            if (id.isPresent()) return id.get();
        }

        // 2) 닉네임 시도 (프로바이더 속성 → 마지막에 auth.getName())
        String nickname = resolveNickname(auth);
        if (has(nickname)) {
            return userRepository.findIdByNickname(nickname)
                    .orElseThrow(() -> new IllegalStateException("User not found by nickname: " + nickname));
        }

        throw new IllegalStateException("Cannot resolve current user: no email/nickname in principal");
    }

    // -------- helpers --------
    private String resolveEmail(Authentication auth) {
        Object p = auth.getPrincipal();
        if (p instanceof OAuth2User o) {
            Map<String, Object> a = o.getAttributes();

            // 일반/표준 키
            String v = s(a.get("email")); if (has(v)) return v;
            v = s(a.get("preferred_username")); if (has(v)) return v; // OIDC
            v = s(a.get("upn")); if (has(v)) return v;                // Azure AD

            // 네이버: { response: { email, ... } }
            Map<String, Object> resp = m(a.get("response"));
            if (resp != null) {
                v = s(resp.get("email")); if (has(v)) return v;
            }

            // 카카오: { kakao_account: { email, ... } }
            Map<String, Object> kakao = m(a.get("kakao_account"));
            if (kakao != null) {
                v = s(kakao.get("email")); if (has(v)) return v;
            }
        }

        // 폼/세션 로그인 등: getName()이 이메일인 케이스
        String name = auth.getName();
        if (has(name) && name.contains("@")) return name;

        return null;
    }

    private String resolveNickname(Authentication auth) {
        Object p = auth.getPrincipal();
        if (p instanceof OAuth2User o) {
            Map<String, Object> a = o.getAttributes();

            // 흔한 키
            String v = s(a.get("nickname")); if (has(v)) return v;
            v = s(a.get("name")); if (has(v)) return v;

            // 네이버
            Map<String, Object> resp = m(a.get("response"));
            if (resp != null) {
                v = s(resp.get("nickname")); if (has(v)) return v;
                v = s(resp.get("name")); if (has(v)) return v;
            }

            // 카카오
            Map<String, Object> kakao = m(a.get("kakao_account"));
            if (kakao != null) {
                Map<String, Object> profile = m(kakao.get("profile"));
                if (profile != null) {
                    v = s(profile.get("nickname")); if (has(v)) return v;
                }
            }
            Map<String, Object> props = m(a.get("properties"));
            if (props != null) {
                v = s(props.get("nickname")); if (has(v)) return v;
            }
        }

        // 마지막 폴백: getName()을 닉네임으로 간주
        String name = auth.getName();
        return has(name) ? name : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String,Object> m(Object o) {
        return (o instanceof Map<?,?> map) ? (Map<String, Object>) map : null;
    }
    private static String s(Object o) { return o == null ? null : o.toString(); }
    private static boolean has(String v) { return v != null && !v.isBlank(); }
}
