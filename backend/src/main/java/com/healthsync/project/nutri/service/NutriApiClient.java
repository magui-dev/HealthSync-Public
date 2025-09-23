package com.healthsync.project.nutri.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthsync.project.nutri.config.DataGoKrProps;
import com.healthsync.project.nutri.dto.NutriParamPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NutriApiClient {

    @Qualifier("restTemplateNoRedirect")
    private final RestTemplate rt;
    private final DataGoKrProps props;
    private final NutriParamPolicy policy;
    private final ObjectMapper om = new ObjectMapper();

    public JsonNode getItems(String apiName, Map<String, String> filters) throws IOException {
        // --- 0) 입력 검증 및 구성 읽기
        DataGoKrProps.Api api = props.getApis().get(apiName);
        if (api == null) {
            throw new IllegalArgumentException("Unknown apiName: " + apiName);
        }

        // baseUrl/path 확인: 절대 www 금지
        String baseUrl = props.getBaseUrl(); // 반드시 "https://api.data.go.kr"
        String path = api.getPath();         // 반드시 "/openapi/tn_pubr_public_nutri_process_info_api"

        if (baseUrl == null || !(baseUrl.startsWith("http://api.data.go.kr") || baseUrl.startsWith("https://api.data.go.kr"))) {
            throw new IllegalStateException("baseUrl must start with http(s)://api.data.go.kr");
        }
        if (path == null || path.isBlank()) {
            throw new IllegalStateException("path is empty");
        }

        // 뒤/앞 슬래시 정리
        baseUrl = baseUrl.replaceAll("/+$", "");  // baseUrl 끝 슬래시 제거
        if (!path.startsWith("/")) path = "/" + path;

        // /openapi 중복/누락 보정
        boolean baseHasOpenapi = baseUrl.endsWith("/openapi");
        boolean pathHasOpenapi = path.startsWith("/openapi/") || path.equals("/openapi");

        if (baseHasOpenapi && pathHasOpenapi) {
            // base에 이미 /openapi가 있으니, path의 /openapi는 제거
            path = path.substring("/openapi".length()); // "/openapi" 제거 → 예: "/tn_pubr_..."
            if (path.isEmpty()) path = "/"; // 혹시 완전 비면 "/"
        }
        if (!baseHasOpenapi && !pathHasOpenapi) {
            // 둘 다 없으면 path 앞에 /openapi 추가
            path = "/openapi" + path;
        }


        // --- 1) serviceKey는 '원본 그대로' 보존 (이미 인코딩일 수 있음)
        String serviceKeyRaw = (api.getServiceKey() != null ? api.getServiceKey() : props.getServiceKey());
        if (serviceKeyRaw == null || serviceKeyRaw.trim().isEmpty()) {
            throw new IllegalStateException("serviceKey is empty");
        }

        // --- 2) 파라미터 정리: 기본값 + 정책 보정
        Map<String, String> q = new LinkedHashMap<String, String>();
        if (filters != null) q.putAll(filters);
        if (!q.containsKey("pageNo")) q.put("pageNo", "1");
        if (!q.containsKey("numOfRows")) q.put("numOfRows", "100");
        if (!q.containsKey("type")) q.put("type", "json"); // XML이 필요하면 호출부에서 바꾸세요
        q = policy.sanitize(apiName, q);

        org.slf4j.LoggerFactory.getLogger(NutriApiClient.class)
                .info("[nutri] {} query={}", apiName, q);

        // --- 3) URI 생성 (serviceKey는 마지막에 '문자열로' 덧붙여 원본 보존)
        UriComponentsBuilder ucb = UriComponentsBuilder
                .fromHttpUrl(baseUrl)
                .path(path);

        for (Map.Entry<String, String> e : q.entrySet()) {
            ucb.queryParam(e.getKey(), e.getValue());
        }


        URI partial = ucb.build().encode(StandardCharsets.UTF_8).toUri();


        String finalUrl = partial.toString()
                + (partial.getQuery() == null || partial.getQuery().isEmpty() ? "?" : "&")
                + "serviceKey=" + serviceKeyRaw;

        /** 테스트 */
        //URI uri = URI.create(finalUrl);
        URI uri = URI.create(finalUrl);
        // ★ 호출 URL 로그
        org.slf4j.LoggerFactory.getLogger(NutriApiClient.class)
                .info("[nutri] GET {}", uri.toString());
        /** 테스트 */



        // --- 4) 요청 헤더
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<Void>(headers);

        // --- 5) 호출
        ResponseEntity<String> res;
        try {
            res = rt.exchange(uri, HttpMethod.GET, req, String.class);
            /** 테스트 */
        } catch (RestClientException e) {
            org.slf4j.LoggerFactory.getLogger(NutriApiClient.class)
                    .warn("[nutri] HTTP 실패: {}", e.toString());
            throw new RuntimeException("HTTP 호출 실패: " + e.getMessage(), e);
        }

        /** 테스트 */

        // --- 6) 응답 검증
        String ct = res.getHeaders().getFirst("Content-Type");
        String body = (res.getBody() == null ? "" : res.getBody());

        if (!res.getStatusCode().is2xxSuccessful()) {
            String snippet = body.length() > 400 ? body.substring(0, 400) + "..." : body;
            throw new RuntimeException("HTTP 호출 실패: " + res.getStatusCode()
                    + " content-type=" + ct + " bodySnippet=" + snippet);
        }

// Content-Type 이 null이어도, 바디가 JSON이면 통과
        JsonNode root;
        try {
            root = om.readTree(body);
        } catch (IOException ex) {
            String snippet = body.length() > 400 ? body.substring(0, 400) + "..." : body;
            throw new RuntimeException("JSON 파싱 실패: content-type=" + ct + " bodySnippet=" + snippet, ex);
        }

// --- 7) 공통 응답 검사
        String code = root.at("/response/header/resultCode").asText("");
        String msg = root.at("/response/header/resultMsg").asText("");

/// ✅ 03(NODATA)는 빈 배열 반환 (이미 적용)
// ✅ 10(INVALID_REQUEST_PARAMETER)도 폴백을 위해 빈 배열 반환
        if ("03".equals(code) || "10".equals(code)) {
            org.slf4j.LoggerFactory.getLogger(NutriApiClient.class)
                    .warn("[nutri] API code={} msg={}", code, msg);
            return om.createArrayNode();
        }

// 그 외 정상(00)만 통과
        if (!"00".equals(code)) {
            org.slf4j.LoggerFactory.getLogger(NutriApiClient.class)
                    .warn("[nutri] API 오류: code={} msg={}", code, msg);
            throw new IllegalStateException("API 오류: " + code + " - " + msg);
        }

// ★ data.go.kr 은 보통 /response/body/items/item 배열
        JsonNode node = root.at("/response/body/items/item");
// 혹시 item이 없이 items가 바로 배열이면 그걸 반환
        return node.isMissingNode() ? root.at("/response/body/items") : node;
    }
}