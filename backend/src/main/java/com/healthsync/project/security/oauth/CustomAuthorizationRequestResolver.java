package com.healthsync.project.security.oauth;

import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository repo) {
        // 기본 매핑: /oauth2/authorization/{registrationId}
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = delegate.resolve(request);
        return customize(req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String registrationId) {
        OAuth2AuthorizationRequest req = delegate.resolve(request, registrationId);
        return customize(req);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest req) {
        if (req == null) return null;

        String regId = req.getAttributes().getOrDefault("registration_id", "").toString();
        Map<String, Object> add = new HashMap<>(req.getAdditionalParameters());

        switch (regId) {
            case "google" -> {
                // 계정 선택 강제
                add.put("prompt", "select_account");
                // 필요시: add.put("access_type", "offline"); add.put("include_granted_scopes", "true");
            }
            case "naver" -> {
                // 재동의 강제(네이버)
                add.put("auth_type", "reprompt");
                // 일부 환경에서 prompt=login이 통하는 경우도 있음: add.put("prompt", "login");
            }
            case "kakao" -> {
                // 원하면 동일 정책
                // add.put("prompt", "login"); // 또는 "consent"
            }
        }

        return OAuth2AuthorizationRequest.from(req)
                .additionalParameters(add)
                .build();
    }
}
