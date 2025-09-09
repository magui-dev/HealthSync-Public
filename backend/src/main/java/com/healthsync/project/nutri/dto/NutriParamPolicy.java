package com.healthsync.project.nutri.dto;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class NutriParamPolicy {

    // 공통
    private static final Set<String> COMMON = Set.of(
            "foodCd","foodNm","dataCd","typeNm","nutConSrtrQua","enerc","prot","fatce","chocdf",
            "sugar","nat","instt_code","instt_nm"
    );

    // 데이터셋별
    private static final Set<String> FOOD_ONLY = Set.of("foodSize","restNm");
    private static final Set<String> MATERIAL_ONLY = Set.of("cooCd","cooNm","imptYn","foodCooRgnNm","prdCollCapMon");
    private static final Set<String> PROCESSED_ONLY = Set.of("servSize","foodSize","mfrNm","imptNm","distNm","imptYn","cooCd","cooNm");
    private static final Set<String> APPROVED_ONLY = Set.of("imptYn", "foodSize", "cooNm", "rtlBzentyNm","imptrNm", "mkrNm", "companyNm");

    private static Set<String> union(Set<String> a, Set<String> b) {
        var s = new HashSet<>(a); s.addAll(b);
        return Collections.unmodifiableSet(s);
    }

    public Set<String> allowedFor(String apiName) {
        return switch (apiName) {
            case "food"      -> union(COMMON, FOOD_ONLY);
            case "material"  -> union(COMMON, MATERIAL_ONLY);
            case "processed" -> union(COMMON, PROCESSED_ONLY);
            case "approved"  -> union(COMMON, APPROVED_ONLY);
            default -> COMMON;
        };
    }

    /** 입력 맵에서 허용된 키만 남기고, 빈 값 제거. type은 소문자 통일 */
    public Map<String,String> sanitize(String apiName, Map<String,String> in) {
        var allow = allowedFor(apiName);
        var out = new LinkedHashMap<String,String>();
        for (var e : in.entrySet()) {
            var k = e.getKey(); var v = e.getValue();
            if (allow.contains(k) && v != null && !v.isBlank()) {
                out.put(k, "type".equals(k) ? v.toLowerCase() : v);
            }
        }
        return out;
    }
}