// src/api/plan.js
import { api } from "./axios";
import axios from "axios"; // ★ 반드시 필요 (없으면 흰 화면)

// 목표 저장
export async function savePlan(payload, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.post("/api/plan/goals", payload, { params });
  return data;
}

// 내 목표 목록
export async function listGoals(opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.get("/api/plan/goals", { params });
  return data;
}

// 목표 단건
export async function getGoal(goalId, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.get(`/api/plan/goals/${goalId}`, { params });
  return data;
}

// 목표 요약(권장 섭취 등)
export async function getSummary(goalId, params = {}) {
  // 1) goalId 없으면 바로 에러 대신 '레거시 경로'로도 시도 (디버깅 로그 포함)
  if (!goalId) {
    console.warn("[getSummary] goalId is missing. Falling back to /api/plan/summary?goalId=...");
    const q = new URLSearchParams({ ...params, goalId }).toString(); // goalId: undefined면 서버가 4xx 반환
    const url = `/api/plan/summary?${q}`;
    console.debug("[getSummary] GET", url);
    const res = await axios.get(url); // 여기서 409면 네트워크 탭에서 URL 확인 가능
    const data = res.data || {};
    return {
      targetDailyCalories: data?.targetDailyCalories ?? data?.dailyKcal ?? null,
      perMealKcal: data?.perMealKcal ?? null,
      mealsPerDay: data?.mealsPerDay ?? null,
      macroRatio:
        data?.macroRatio ??
        data?.macro_ratio ??
        (data?.ratioCarb || data?.ratio_carb || data?.ratioProt || data?.ratio_prot || data?.ratioFat || data?.ratio_fat
          ? {
            carb: data?.ratioCarb ?? data?.ratio_carb ?? null,
            protein: data?.ratioProt ?? data?.ratio_prot ?? null,
            fat: data?.ratioFat ?? data?.ratio_fat ?? null,
          }
          : null),
    };
  }

  // 2) 정상 경로: /api/plan/goals/{goalId}/summary?mealsPerDay=...
  const q = new URLSearchParams(params).toString();
  const url = `/api/plan/goals/${encodeURIComponent(goalId)}/summary${q ? `?${q}` : ""}`;
  console.debug("[getSummary] GET", url);
  const { data } = await axios.get(url, { headers: { Accept: "application/json" } });

  // 키 호환: targetDailyCalories > dailyKcal
  return {
    targetDailyCalories: data?.targetDailyCalories ?? data?.dailyKcal ?? null,
    perMealKcal: data?.perMealKcal ?? null,
    mealsPerDay: data?.mealsPerDay ?? null,
    macroRatio: data?.macroRatio ?? null,
  };
}

// 스냅샷(GoalMetrics)
export async function getGoalMetrics(goalId, params) {
  const { data } = await axios.get(`/api/plan/goals/${goalId}/metrics`, { params });
  // snake/camel 모두 호환
  return {
    targetDailyCalories: data?.target_daily_kcal ?? data?.targetDailyKcal ?? null,
    perMealKcal: data?.per_meal_kcal ?? data?.perMealKcal ?? null,
    ratioCarb: data?.ratio_carb ?? data?.ratioCarb ?? null,
    ratioProt: data?.ratio_prot ?? data?.ratioProt ?? null,
    ratioFat: data?.ratio_fat ?? data?.ratioFat ?? null,
    mealsPerDay: data?.meals_per_day ?? data?.mealsPerDay ?? null,
  };
}

export async function saveGoalMetrics(goalId, payload, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.post(`/api/plan/goals/${goalId}/metrics`, payload, { params });
  return data;
}

// 다른 모듈에서 쓰고 있을 수 있으니 유지
export { searchNutri } from "./nutri";

// ★ MacroBoard.jsx가 요구하는 export가 없어서 앱이 죽는 것 방지용 스텁
export async function listFoodSelections(/* goalId */) {
  return []; // 실제 API 붙이기 전까지 빈 배열 반환
}
// 혹시 다른 이름으로 import 하는 경우 대비한 alias
export const listFoodSelectionsByGoal = listFoodSelections;

export async function saveFoodSelection(/* payload */) {
  return { ok: true };
}
export async function deleteFoodSelection(/* id */) {
  return { ok: true };
}
