// src/api/plan.js
import { api } from "./axios";
import axios from "axios"; // 기본 axios (fallback, 절대경로 호출 등에 사용)

// ───────────────── 목표 CRUD ─────────────────
export async function savePlan(payload, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.post("/api/plan/goals", payload, { params });
  return data;
}

export async function listGoals(opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.get("/api/plan/goals", { params });
  return data;
}

export async function getGoal(goalId, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.get(`/api/plan/goals/${goalId}`, { params });
  return data;
}

// ★ 삭제(PlanSetup에서 팝업 내 ‘삭제’ 버튼이 사용)
export async function deleteGoal(goalId, opts) {
  const params = opts?.userId ? { userId: opts.userId } : undefined;
  const { data } = await api.delete(`/api/plan/goals/${goalId}`, { params });
  return data;
}

// ───────────────── 요약/지표 ─────────────────
export async function getSummary(goalId, params = {}) {
  // 1) goalId가 없으면 레거시 엔드포인트로 시도 (디버깅 로그 포함)
  if (!goalId) {
    console.warn("[getSummary] goalId missing. Falling back to /api/plan/summary");
    const q = new URLSearchParams({ ...params }).toString();
    const url = `/api/plan/summary${q ? `?${q}` : ""}`;
    console.debug("[getSummary] GET", url);
    const res = await axios.get(url, { headers: { Accept: "application/json" } });
    const data = res.data || {};
    return {
      targetDailyCalories: data?.targetDailyCalories ?? data?.dailyKcal ?? null,
      perMealKcal: data?.perMealKcal ?? null,
      mealsPerDay: data?.mealsPerDay ?? null,
      macroRatio:
        data?.macroRatio ??
        (data?.ratioCarb || data?.ratioProt || data?.ratioFat
          ? {
              carb: data?.ratioCarb ?? null,
              protein: data?.ratioProt ?? null,
              fat: data?.ratioFat ?? null,
            }
          : null),
    };
  }

  // 2) 정상 경로
  const q = new URLSearchParams(params).toString();
  const url = `/api/plan/goals/${encodeURIComponent(goalId)}/summary${q ? `?${q}` : ""}`;
  console.debug("[getSummary] GET", url);
  const { data } = await axios.get(url, { headers: { Accept: "application/json" } });

  return {
    targetDailyCalories: data?.targetDailyCalories ?? data?.dailyKcal ?? null,
    perMealKcal: data?.perMealKcal ?? null,
    mealsPerDay: data?.mealsPerDay ?? null,
    macroRatio: data?.macroRatio ?? null,
  };
}

export async function getGoalMetrics(goalId, params) {
  const { data } = await axios.get(`/api/plan/goals/${goalId}/metrics`, { params });
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

// ───────────────── 보조/호환 ─────────────────
export { searchNutri } from "./nutri";

// MacroBoard.jsx 등에서 import가 이미 존재할 수 있어 스텁 유지
export async function listFoodSelections(/* goalId */) {
  return [];
}
export const listFoodSelectionsByGoal = listFoodSelections;

export async function saveFoodSelection(/* payload */) {
  return { ok: true };
}
export async function deleteFoodSelection(/* id */) {
  return { ok: true };
}
