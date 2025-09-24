package com.healthsync.project.nutri.controller;

import com.fasterxml.jackson.databind.JsonNode;
//import com.healthsync.project.nutri.dto.NutriInfoDto;
import com.healthsync.project.nutri.service.NutriApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
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
//}


//    private final NutriService nutriService;
//
//    @GetMapping("/search")
//    public ResponseEntity<List<NutriInfoDto>> search(
//            @RequestParam(name = "q", required = false) String q,
//            @RequestParam(name = "name", required = false) String name
//    ) throws Exception {
//        String term = (q != null && !q.isBlank()) ? q : name;
//        if (term == null || term.isBlank()) {
//            return ResponseEntity.badRequest().build();
//        }
//
//        log.info("'{}'에 대한 실시간 포함 검색을 시작합니다.", term);
//
//        String[] plan = {"approved", "food", "processed", "material"};
//
//        for (String apiName : plan) {
//            log.info("{} API에서 대량 데이터 조회를 시도합니다...", apiName);
//
//            // 1. 공공 API에서 검색어 없이 대량의 데이터(최대 1000개)를 가져옵니다.
//            //    이 과정에서 시간이 오래 걸릴 수 있습니다.
//            JsonNode allItems = client.getItems(apiName, Map.of("numOfRows", "1000"));
//
//            if (allItems.isArray() && !allItems.isEmpty()) {
//                // 2. 가져온 전체 데이터 안에서, 자바 코드로 'term'이 포함된 항목을 필터링합니다.
//                List<NutriInfoDto> foundItems = StreamSupport.stream(allItems.spliterator(), false)
//                        .map(nutriService::extractNutriInfo)
//                        .filter(dto -> dto.getFoodName() != null && dto.getFoodName().contains(term))
//                        .collect(Collectors.toList());
//
//                // 3. 필터링된 결과가 하나라도 있으면, 즉시 반환하고 검색을 종료합니다.
//                if (!foundItems.isEmpty()) {
//                    log.info("{} API에서 '{}'을(를) 포함하는 {}개의 결과를 찾았습니다.", apiName, term, foundItems.size());
//                    return ResponseEntity.ok(foundItems);
//                }
//            }
//            log.info("{} API에는 '{}'을(를) 포함하는 결과가 없습니다.", apiName, term);
//        }
//
//        // 모든 API를 다 뒤졌지만 결과가 없는 경우
//        log.info("'{}'에 대한 검색 결과가 모든 API에 없습니다.", term);
//        return ResponseEntity.ok(Collections.emptyList());
//    }
//}