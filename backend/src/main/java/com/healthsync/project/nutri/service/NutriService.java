package com.healthsync.project.nutri.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
//import com.healthsync.project.nutri.dto.NutriInfoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NutriService {

    private final NutriApiClient apiClient;
    private final ObjectMapper mapper;

    // 필드명 매핑
    private static final Map<String, String> FIELD_NAME_MAP = Map.ofEntries(
            Map.entry("foodCd", "식품코드"),
            Map.entry("foodNm", "식품명"),
            // ✅ 공공데이터포털(Korean) 주요 키 매핑 추가
            Map.entry("DESC_KOR", "식품명"),
            Map.entry("NUTR_CONT1", "에너지(kcal)"),   // kcal
            Map.entry("NUTR_CONT2", "탄수화물(g)"),
            Map.entry("NUTR_CONT3", "단백질(g)"),
            Map.entry("NUTR_CONT4", "지방(g)"),
            Map.entry("SERVING_WT", "식품중량"),
            Map.entry("SERVING_SIZE", "식품중량"),
            Map.entry("SERVING_UNIT", "영양성분함량기준량"),
            Map.entry("baseQty", "영양성분함량기준량"),
            Map.entry("enerc", "에너지(kcal)"),
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
        ArrayNode list = asArray(original);
        ArrayNode translatedArray = mapper.createArrayNode();

        if (list == null) return translatedArray; // 빈배열 리턴

        for (JsonNode node : list) {
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
    public Integer findKcalPer100g(String name) {
        try {
            ArrayNode list = null;

            // 1) approved
            list = asArray(apiClient.getItems("approved", Map.of(
                    "foodNm", name, "numOfRows","1", "pageNo","1", "type","json"
            )));

            // 2) processed
            if (list == null || list.size() == 0) {
                list = asArray(apiClient.getItems("processed", Map.of(
                        "foodNm", name, "numOfRows","1", "pageNo","1", "type","json"
                )));
            }

            // (원하면 아주 마지막에 approved를 “검색 없이” 한 페이지만 긁는 폴백으로 둬도 됨)
            // if (list == null || list.size() == 0) {
            //     list = asArray(apiClient.getItems("approved", Map.of(
            //         "numOfRows","1","pageNo","1","type","json"
            //     )));
            // }

            // 3) food
            if (list == null || list.size() == 0) {
                list = asArray(apiClient.getItems("food", Map.of(
                        "foodNm", name, "numOfRows","1", "pageNo","1", "type","json"
                )));
            }

            // 번역된 키로 통일해서 뽑기
            JsonNode tr = translateKeys(list);
            if (tr == null || !tr.elements().hasNext()) return null;
            JsonNode firstTr = tr.elements().next();

            String kcalStr   = optText(firstTr, "에너지(kcal)");   // 스냅샷 필드명과 일치
            String weightStr = firstNonBlank(
                    optText(firstTr, "식품중량"),
                    optText(firstTr, "영양성분함량기준량")
            );
            if (kcalStr == null || kcalStr.isBlank()) return null;

            BigDecimal kcal  = parseDecimal(kcalStr);
            if (kcal == null) return null;

            BigDecimal grams = parseServingToGrams(weightStr);
            if (grams == null || grams.compareTo(BigDecimal.ZERO) == 0) {
                return kcal.setScale(0, RoundingMode.HALF_UP).intValue(); // 100g 가정
            }

            BigDecimal per100g = kcal.divide(grams, 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            return per100g.setScale(0, RoundingMode.HALF_UP).intValue();

        } catch (Exception e) {
            // (선택) 로그만 남기고 null
            return null;
        }
    }

    private static String optText(JsonNode node, String field) {
        return Optional.ofNullable(node.get(field)).map(JsonNode::asText).orElse(null);
    }

    private static BigDecimal parseDecimal(String s) {
        if (s == null) return null;
        // "123.4", "123", "123 kcal" 등 잡스러운 값 방어
        String cleaned = s.replaceAll("[^0-9.\\-]", "");
        if (cleaned.isBlank()) return null;
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    //응답을 항상배열로 정규화하는 헬퍼 추가
    private ArrayNode asArray(JsonNode raw) {
        if (raw == null) return null;
        if (raw.isArray()) return (ArrayNode) raw;

        // 흔한 케이스들 방어
        // ★ data.go.kr 패턴: items -> item 배열
        if (raw.has("items")) {
            JsonNode items = raw.get("items");
            if (items.isArray()) return (ArrayNode) items; // 혹시 바로 배열인 케이스
            if (items != null && items.has("item") && items.get("item").isArray()) {
                return (ArrayNode) items.get("item");
            }
        }
        // ★ 혹시 바로 item 배열로 내려오는 케이스
        if (raw.has("item") && raw.get("item").isArray()) {
            return (ArrayNode) raw.get("item");
        }
        // ★ CSV/다운로드 형식 대응(레퍼런스 파일과 동일)
        if (raw.has("records") && raw.get("records").isArray()) {
            return (ArrayNode) raw.get("records");
        }

        if (raw.has("data") && raw.get("data").isArray()) return (ArrayNode) raw.get("data");
        // 단일 객체면 배열로 감싸기
        ArrayNode arr = mapper.createArrayNode();
        if (raw.isObject()) arr.add(raw);
        return arr;
    }

    private static String firstNonBlank(String... vals) {
        if (vals == null) return null;
        for (String v : vals) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    /**
     * "100g", "1회(30g)", "1포(45 g)" 같은 문자열에서 'g' 앞 숫자를 BigDecimal로 추출
     */
    private static BigDecimal parseServingToGrams(String s) {
        if (s == null || s.isBlank()) return null;
        // 괄호 안/밖 모두 탐색: 마지막 'g' 앞 숫자 뽑기
        // 예) "1회(30g)" → 30, "100g" → 100, "1포(45 g)" → 45
        var m = java.util.regex.Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*g", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(s);
        BigDecimal last = null;
        while (m.find()) {
            try {
                last = new BigDecimal(m.group(1));
            } catch (NumberFormatException ignore) {
            }
        }
        return last;
    }


}

//    // 0924 추가, 오픈 API 열결 테스트
//    public NutriInfoDto extractNutriInfo(JsonNode rawNode) {
//        // 1. 단일 노드의 키 이름을 한글로 변환합니다.
//        // (기존의 translateKeys 메서드는 배열 전체를 변환하므로, 여기서는 단일 객체만 처리하도록 로직을 새로 구성합니다.)
//        ObjectNode translatedNode = mapper.createObjectNode();
//        rawNode.fieldNames().forEachRemaining(key -> {
//            String translatedKey = FIELD_NAME_MAP.getOrDefault(key, key);
//            translatedNode.set(translatedKey, rawNode.get(key));
//        });
//
//        // 2. 변환된 노드에서 필요한 값을 추출합니다. (기존 optText 헬퍼 메서드 사용)
//        String foodName = optText(translatedNode, "식품명");
//        String kcal = optText(translatedNode, "에너지(kcal)");
//        String carbs = optText(translatedNode, "탄수화물(g)");
//        String protein = optText(translatedNode, "단백질(g)");
//        String fat = optText(translatedNode, "지방(g)");
//
//        // 3. DTO에 담아 반환합니다.
//        return new NutriInfoDto(foodName, kcal, carbs, protein, fat);
//    }
