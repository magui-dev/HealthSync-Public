// frontend/src/api/nutri.js
import { api } from "./axios";               // ✅ 공용 인스턴스(8080으로 프록시되는 그거)

export async function searchNutri(name) {
  const url = "/api/nutri/search";           // ✅ 백엔드 컨트롤러: @RequestMapping("/api/nutri")
  console.log("[nutri] GET", url, { name }); // ✅ 어떤 이름으로 치는지 콘솔에서 확인
  const { data } = await api.get(url, { params: { name } });
  console.log("[nutri] ->", Array.isArray(data) ? data.length : data);
  return Array.isArray(data) ? data : [];
}
