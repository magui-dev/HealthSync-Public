import { api } from "./axios"; // 공용 axios 인스턴스 (named export)

const BASE = import.meta?.env?.VITE_API_BASE_URL || "";
const url = (p) => (BASE ? BASE + p : p);

const toJson = async (res) => {
  if (!res.ok) {
    let msg = "";
    try { msg = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  return res.json();
};

const withCred = (init = {}) => ({ credentials: "include", ...init });

/* ---- Goals ---- */
export const listGoals = () =>
  fetch(url("/api/plan/goals"), withCred()).then(toJson);

export const getSummary = (id) =>
  fetch(url(`/api/plan/goals/${id}/summary`), withCred()).then(toJson);

export const createGoal = (payload) =>
  fetch(url("/api/plan/goals"), withCred({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })).then(toJson);

/* ---- Nutrition ---- */
export const searchNutri = (q) =>
  fetch(url(`/api/nutri/search?q=${encodeURIComponent(q)}`), withCred()).then(toJson);

export const listFoodSelections = (goalId) =>
  fetch(url(`/api/plan/food-selections?goalId=${goalId}`), withCred()).then(toJson);

export const saveFoodSelection = (payload) =>
  fetch(url("/api/plan/food-selections"), withCred({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })).then(toJson);


export async function savePlan(payload) {
  // 백엔드에 맞춰 경로/필드명만 조정
  // 예: POST /api/plan/goals
  const { data } = await api.post("/api/plan/goals", payload);
  return data;
}