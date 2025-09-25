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
            throw new org.springframework.security.access.AccessDeniedException("Unauthenticated");
        }

        // 1) 이메일 우선
        String email = resolveEmail(auth);
        if (has(email)) {
            var byEmail = userRepository.findIdByEmail(email);
            if (byEmail.isPresent()) return byEmail.get();
        }

        // 2) 닉네임
        String nickname = resolveNickname(auth);
        if (has(nickname)) {
            var byNick = userRepository.findIdByNickname(nickname);
            if (byNick.isPresent()) return byNick.get();
        }

        // 3) 마지막 폴백: auth.getName()을 이메일/닉네임 둘 다로 시도
        String name = auth.getName();
        if (has(name)) {
            return userRepository.findIdByEmail(name)
                    .or(() -> userRepository.findIdByNickname(name))
                    .or(() -> {
                        try {
                            // 일부 프로바이더는 getName()이 내부 numeric id인 경우가 있음
                            Long maybeId = Long.valueOf(name);
                            return userRepository.findById(maybeId).map(u -> u.getId());
                        } catch (Exception ignore) {
                            return Optional.empty();
                        }
                    })
                    .orElseThrow(() ->
                            new org.springframework.security.access.AccessDeniedException("User not mapped"));
        }

        throw new IllegalStateException("Cannot resolve current user: no email/nickname in principal");
    }

    /** 로그인 안 되어 있으면 null 반환(예외 던지지 않음) */
    public Long getOrNull() {
        return tryResolve().orElse(null);
    }

    /** 로그인 안 되어 있으면 Optional.empty() 반환 */
    public Optional<Long> tryResolve() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();

        // 스프링 anonymousUser 처리
        Object principal = auth.getPrincipal();
        if (principal == null || "anonymousUser".equals(principal)) return Optional.empty();

        // 1) 이메일
        String email = resolveEmail(auth);
        if (has(email)) {
            var byEmail = userRepository.findIdByEmail(email);
            if (byEmail.isPresent()) return byEmail;
        }

        // 2) 닉네임
        String nickname = resolveNickname(auth);
        if (has(nickname)) {
            var byNick = userRepository.findIdByNickname(nickname);
            if (byNick.isPresent()) return byNick;
        }

        // 3) getName() 폴백
        String name = auth.getName();
        if (has(name)) {
            return userRepository.findIdByEmail(name)
                    .or(() -> userRepository.findIdByNickname(name))
                    .or(() -> {
                        try {
                            Long maybeId = Long.valueOf(name);
                            return userRepository.findById(maybeId).map(u -> u.getId());
                        } catch (Exception ignore) {
                            return Optional.empty();
                        }
                    });
        }
        return Optional.empty();
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
