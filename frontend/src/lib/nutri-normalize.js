// src/lib/nutri-normalize.js
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(String(v).replace(/,/g, "")));

export function normalizeNutri(item) {
  const name = item.foodNm || item.DESC_KOR || item.prdlstNm || item.MATRL_NM || item.food_name || item.name || "";
  const kcal     = toNum(item.enerc || item.ENERC || item.NUTR_CONT1 || item.kcal);
  const protein  = toNum(item.prot  || item.PROT  || item.NUTR_CONT3);
  const fat      = toNum(item.fatce || item.FAT   || item.NUTR_CONT4);
  const carbs    = toNum(item.chocdf|| item.CHO   || item.NUTR_CONT2);
  const sugar    = toNum(item.sugar || item.NUTR_CONT5);
  const sodiumMg = toNum(item.na    || item.NA    || item.NUTR_CONT6);
  return { name, kcal, protein, fat, carbs, sugar, sodiumMg, raw: item };
}
