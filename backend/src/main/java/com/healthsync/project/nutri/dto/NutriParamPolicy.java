package com.healthsync.project.nutri.dto;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class NutriParamPolicy {
    public Map<String,String> sanitize(String apiName, Map<String,String> q) {
        if (q == null) return Map.of();

        // 통합 name -> API별 실제 키 매핑
        String name = q.getOrDefault("name", q.getOrDefault("q", null));
        if (name != null && !name.isBlank()) {
            switch (apiName) {
                case "approved":
                    q.remove("prdlstNm"); q.remove("foodNm"); q.remove("MATRL_NM");
                    q.put("DESC_KOR", name); break;
                case "food":
                    q.remove("prdlstNm"); q.remove("DESC_KOR"); q.remove("MATRL_NM");
                    q.put("foodNm", name); break;
                case "processed":
                    q.remove("foodNm"); q.remove("DESC_KOR"); q.remove("MATRL_NM");
                    q.put("prdlstNm", name); break;
                case "material":
                    q.remove("foodNm"); q.remove("DESC_KOR"); q.remove("prdlstNm");
                    q.put("MATRL_NM", name); break;
            }
        }

        // 잘못 붙은 키들 정정 (호출부가 특정 키로 보냈더라도 교정)
        if ("approved".equals(apiName) && q.containsKey("prdlstNm")) {
            q.put("DESC_KOR", q.remove("prdlstNm"));
        }
        if ("food".equals(apiName) && q.containsKey("prdlstNm")) {
            q.put("foodNm", q.remove("prdlstNm"));
        }
        if ("processed".equals(apiName) && q.containsKey("foodNm")) {
            q.put("prdlstNm", q.remove("foodNm"));
        }
        if ("material".equals(apiName) && q.containsKey("foodNm")) {
            q.put("MATRL_NM", q.remove("foodNm"));
        }

        // 기본 파라미터 부족 시 보충은 기존대로 (pageNo/numOfRows/type 등)
        return q;
    }
}
