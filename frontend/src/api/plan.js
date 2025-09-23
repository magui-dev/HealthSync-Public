// frontend/src/api/plan.js
import { api } from "./axios"; // 공용 axios 인스턴스

/** Goals */
export async function savePlan(payload) {
  const { data } = await api.post("/api/plan/goals", payload);
  return data;
}
export const createGoal = savePlan;

export async function listGoals() {
  const { data } = await api.get("/api/plan/goals");
  return data; // 최신순
}

export async function getSummary(goalId) {
  // 우선 /api/plan/summary/{id} 호출, 404면 /api/plan/goals/{id}/summary로 폴백
  try {
    const { data } = await api.get(`/api/plan/summary/${goalId}`);
    return data;
  } catch (e) {
    if (e?.response?.status === 404) {
      const { data } = await api.get(`/api/plan/goals/${goalId}/summary`);
      return data;
    }
    throw e;
  }
}

export async function getPresets() {
  const { data } = await api.get("/api/plan/presets");
  return data; // { carb:[{key,name,icon,kcalPer100g}], protein:[], fat:[] }
}

/** Food selections */
export async function listFoodSelections(goalId) {
  const { data } = await api.get("/api/plan/food-selections", { params: { goalId } });
  return data;
}
export async function saveFoodSelection(payload) {
  const { data } = await api.post("/api/plan/food-selections", payload);
  return data;
}

/** Nutrition */
const toNum = (v) =>
  v === null || v === undefined || v === "" ? null : Number(String(v).replace(/,/g, ""));

function normalizeItem(item) {
  // 이름: 데이터셋별 후보 키
  const name =
    item.name ||
    item.foodNm ||
    item.DESC_KOR ||
    item.prdlstNm ||
    item.MATRL_NM ||
    item.food_name ||
    "";

  // 1회 제공량(g): 데이터셋별 후보 키
  const serving_g = toNum(
    item.serving_g ||
    item.SERVING_WT ||
    item.serving_wt ||
    item.SERVING_SIZE ||
    item.SERVING ||
    item.serving
  );

  // 열량/3대영양소: 여러 데이터셋 키를 모두 커버
  const kcal = toNum(item.kcal || item.ENERC_KCAL || item.ENERC || item.NUTR_CONT1);
  const carbs_g = toNum(item.carbs_g || item.CHOCDF || item.CHO || item.NUTR_CONT2);
  const protein_g = toNum(item.protein_g || item.PROCNT || item.PROT || item.NUTR_CONT3);
  const fat_g = toNum(item.fat_g || item.FAT || item.NUTR_CONT4);

  // 리스트 key용 id 대체키
  const id =
    item.id ||
    item.PRDLST_REPORT_NO || // 가공식품
    item.GUID ||
    item.NUM ||
    `${name}-${kcal ?? "0"}-${carbs_g ?? "0"}-${protein_g ?? "0"}-${fat_g ?? "0"}`;

  return { id, name, serving_g, kcal, carbs_g, protein_g, fat_g, _raw: item };
}

export async function searchNutri(name) {
  const { data } = await api.get("/api/nutri/search", { params: { name } });
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeItem).filter((it) => it.name);
}