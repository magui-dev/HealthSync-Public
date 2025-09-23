// /hooks/activityLevel.js
export const LEVELS = [
  { key: 1, label: '활동 지수 1', desc: '사무직 (운동 거의 없음)', factor: 0.2, color: '#cfe8ff' },
  { key: 2, label: '활동 지수 2', desc: '가벼운 운동 주 2회',     factor: 0.3, color: '#a7e3c9' },
  { key: 3, label: '활동 지수 3', desc: '중간 강도 주 3~5일',     factor: 0.5, color: '#ffe08a' },
  { key: 4, label: '활동 지수 4', desc: '고강도 주 6~7일',       factor: 0.7, color: '#ffb27a' },
];

export function buildActivitySegments() {
  return LEVELS.map((lv) => ({ ...lv, widthPct: 25 })); // 4등분 고정
}


// ✅ 레벨별 포인터 이미지 경로 (원하는 파일로 교체)
export const LEVEL_POINTERS = {
  1: '/icons/level1.png',
  2: '/icons/level2.png',
  3: '/icons/level3.png',
  4: '/icons/level4.png',
};


// ✅ 반드시 export 붙이기!
export function positionLevelPointer(level) {
  if (!level || level < 1 || level > 4) return { show: false, leftPct: 0 };
  return { show: true, leftPct: (level - 0.5) * 25 }; // 12.5, 37.5, 62.5, 87.5
}
