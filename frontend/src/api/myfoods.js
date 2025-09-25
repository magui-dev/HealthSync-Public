// src/api/myfoods.js
import { api } from "./axios";

// 배열 전체 저장(백엔드에서 upsert or replace 방식으로 처리)
export async function saveMyFoods(items) {
  // BE와 합의한 payload 형태: per100은 그대로 보냄
  const payload = {
    items: items.map(({ id, ...rest }) => rest) // id는 프론트 임시값이니 제거
  };
  const { data } = await api.post("/api/myfoods", payload);
  return data;
}

// (선택) 불러오기
export async function listMyFoods() {
  const { data } = await api.get("/api/myfoods");
  return data;
}
