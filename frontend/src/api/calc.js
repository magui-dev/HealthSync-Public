import { api } from "./axios";

// Metrics(TDEE 포함, TEF 적용) 가져오기
export async function getMetrics(userId) {
  const { data } = await api.post("/api/calc/bmi", null, { params: { userId } });
  return data; // { bmi, bmr, dailyCalories, ... }
}
