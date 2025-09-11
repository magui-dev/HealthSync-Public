package com.healthsync.project.nutri.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class NutriService {

    private final NutriApiClient apiClient;
    private final ObjectMapper mapper;

    // 필드명 매핑
    private static final Map<String, String> FIELD_NAME_MAP = Map.ofEntries(
            Map.entry("foodCd", "식품코드"),
            Map.entry("foodNm", "식품명"),
            Map.entry("enerc", "열량(kcal)"),
            Map.entry("prot", "단백질(g)"),
            Map.entry("fatce", "지방(g)"),
            Map.entry("chocdf", "탄수화물(g)"),
            Map.entry("nat", "나트륨(mg)"),
            Map.entry("crtYmd", "생성일자"),
            Map.entry("crtrYmd", "기준일자"),
            Map.entry("insttNm", "기관명"),
            Map.entry("srcNm", "출처명"),
            Map.entry("foodSize", "식품중량"),
            Map.entry("imptYn", "수입 여부"),
            Map.entry("cooNm", "원산지국 명"),
            Map.entry("companyNm", "업체명"),
            Map.entry("mkrNm", "제조사명"),
            Map.entry("imptrNm", "수입업체명"),
            Map.entry("rtlBzentyNm", "유통업체명"),
            Map.entry("instt_code", "제공기관 코드")
    );

    // 응답 필드 변환
    public JsonNode translateKeys(JsonNode original) {
        ArrayNode translatedArray = mapper.createArrayNode();

        for (JsonNode node : original) {
            ObjectNode newNode = mapper.createObjectNode();
            node.fieldNames().forEachRemaining(key -> {
                String translatedKey = FIELD_NAME_MAP.getOrDefault(key, key);
                newNode.put(translatedKey, node.get(key).asText());
            });
            translatedArray.add(newNode);
        }
        return translatedArray;
    }

    // API 호출 + 응답 변환
    public JsonNode getTranslatedData(String apiName, Map<String, String> params) throws Exception {
        JsonNode raw = apiClient.getItems(apiName, params);
        return translateKeys(raw);
    }
}
