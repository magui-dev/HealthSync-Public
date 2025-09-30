// src/api/profile.js
import { api } from "./http";

export async function getMyProfile() {
  // ✅ 백엔드 매핑: GET /profile
  const { data } = await api.get("/profile");
  return data; // { age, gender, height, weight, activityLevel, updateAt, profileImageUrl }
}
