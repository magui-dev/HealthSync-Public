package com.healthsync.project.nutri.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.healthsync.project.nutri.service.NutriApiClient;
import com.healthsync.project.nutri.service.NutriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/nutri")
public class NutriController {
    private final NutriApiClient client;

    // 1) 원본 API 프록시 (디버그/확인용)
    // 예: /nutri/food?foodNm=아몬드&type=json&pageNo=1&numOfRows=10

    // search, kcal 과 충돌 방지 (선택이지만 권장)
    @GetMapping(path = "/{api:^(?!search$|kcal$).+}")
    public ResponseEntity<JsonNode> proxy(@PathVariable String api, @RequestParam Map<String, String> q) throws Exception {
        JsonNode items = client.getItems(api, q);
        return ResponseEntity.ok(items);
    }

    // 2) 통합 검색 (라면/아몬드 등 이름으로)
    // 예: /nutri/search?name=라면
    @GetMapping("/search")
    public ResponseEntity<JsonNode> search(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "name", required = false) String name
    ) throws Exception {
        String term = (q != null && !q.isBlank()) ? q : name;
        if (term == null || term.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // approved → food → processed → material 순차 시도
        String[][] plan = {
                {"approved", "DESC_KOR"},
                {"food", "foodNm"},
                {"processed", "prdlstNm"},
                {"material", "MATRL_NM"}
        };
        for (String[] step : plan) {
            Map<String, String> f = new LinkedHashMap<>();
            f.put(step[1], term);
            JsonNode arr = client.getItems(step[0], f);
            if (arr.isArray() && arr.size() > 0) return ResponseEntity.ok(arr);
        }
        // 전부 NODATA면 빈 배열
        return ResponseEntity.ok(client.getItems("approved", Map.of("DESC_KOR", "__NODATA__"))); // 빈 배열 보장 트릭
    }

    // 3) kcal 전용 (필요 시)
    // 예: /nutri/kcal?name=라면
    @GetMapping("/kcal")
    public ResponseEntity<JsonNode> kcal(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "name", required = false) String name
    ) throws Exception {
        String term = (q != null && !q.isBlank()) ? q : name;
        if (term == null || term.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, String> f = new LinkedHashMap<>();
        f.put("DESC_KOR", term); // 우선 approved 기준
        JsonNode arr = client.getItems("approved", f);
        return ResponseEntity.ok(arr);
    }


//    private final NutriService nutriService;
//
//    @GetMapping("/{api}")
//    public ResponseEntity<JsonNode> search(
//            @PathVariable String api,
//            @RequestParam Map<String, String> params
//    ) throws Exception {
//        JsonNode translatedData = nutriService.getTranslatedData(api, params);
//        return ResponseEntity.ok(translatedData);
//    }
}
