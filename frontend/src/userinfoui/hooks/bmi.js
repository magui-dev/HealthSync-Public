// /lib/bmi.js
export const DISPLAY_MIN = 15;
export const DISPLAY_MAX = 40;

export const BMI_BUCKETS_KR = [
  { label: '저체중',     min: -Infinity, max: 18.5,  color: '#3498db', range: '< 18.5' },
  { label: '정상',       min: 18.5,     max: 22.9,  color: '#2ecc71', range: '18.5 ~ 22.9' },
  { label: '비만전단계', min: 23.0,     max: 24.9,  color: '#f1c40f', range: '23.0 ~ 24.9' },
  { label: '1단계 비만', min: 25.0,     max: 29.9,  color: '#e67e22', range: '25.0 ~ 29.9' },
  { label: '2단계 비만', min: 30.0,     max: 34.9,  color: '#e74c3c', range: '30.0 ~ 34.9' },
  { label: '3단계 비만', min: 35.0,     max: Infinity, color: '#c0392b', range: '≥ 35.0' },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function getBMICategory(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) return '-';
  if (bmi < 18.5)    return '저체중';
  if (bmi <= 22.9)   return '정상';
  if (bmi <= 24.9)   return '비만전단계';
  if (bmi <= 29.9)   return '1단계 비만';
  if (bmi <= 34.9)   return '2단계 비만';
  return '3단계 비만';
}

export function buildSegments() {
  const total = DISPLAY_MAX - DISPLAY_MIN;
  let prevMax = DISPLAY_MIN;
  const segments = [];

  for (const b of BMI_BUCKETS_KR) {
    const intendedMax = Number.isFinite(b.max) ? clamp(b.max, DISPLAY_MIN, DISPLAY_MAX) : DISPLAY_MAX;

    // 구간을 연속으로 잇기: 시작은 항상 직전 종료(prevMax)에서 시작
    const segMin = prevMax;
    const segMax = intendedMax;

    const width = Math.max(0, segMax - segMin);
    if (width > 0) {
      segments.push({ ...b, widthPct: (width / total) * 100, hidden: false });
    }

    prevMax = segMax;
    if (prevMax >= DISPLAY_MAX) break; // 표시 영역을 끝까지 채우면 종료
  }

  return segments;
}

function dedupeSorted(nums, eps = 1e-6) {
  const out = [];
  for (const v of nums.sort((a, b) => a - b)) {
    if (out.length === 0 || Math.abs(out[out.length - 1] - v) > eps) out.push(v);
  }
  return out;
}

/**
 * 경계 눈금을 "구간 사이값(= 다음 버킷의 min)"만으로 생성
 * - 기본: 18.5, 23.0, 25.0, 30.0, 35.0 (한 줄씩)
 * - includeEnds=true면 15, 40도 얇게 포함 가능
 */
export function buildBoundaryTicks({ includeEnds = false } = {}) {
  const raw = [];
  if (includeEnds) raw.push(DISPLAY_MIN);

  // 이전 버킷의 max들을 경계로 사용: 18.5, 22.9, 24.9, 29.9, 34.9
  for (let i = 0; i < BMI_BUCKETS_KR.length - 1; i++) {
    const currMax = BMI_BUCKETS_KR[i]?.max;
    if (!Number.isFinite(currMax)) continue;

    const v = clamp(currMax, DISPLAY_MIN, DISPLAY_MAX);
    if (v > DISPLAY_MIN && v < DISPLAY_MAX) raw.push(v);
  }

  if (includeEnds) raw.push(DISPLAY_MAX);

  const vals = dedupeSorted(raw);
  const toPct = (v) => ((v - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 100;

  return vals.map(v => ({
    v,
    leftPct: toPct(v),
    strong: true, // 경계는 강조
  }));
}
export function positionArrow(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) return { show: false, leftPct: 0, clamped: false };
  const c = clamp(bmi, DISPLAY_MIN, DISPLAY_MAX);
  return {
    show: true,
    leftPct: ((c - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 100,
    clamped: c !== bmi,
  };
}