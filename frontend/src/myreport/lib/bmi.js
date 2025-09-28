// /lib/bmi.js
export const DISPLAY_MIN = 15;
export const DISPLAY_MAX = 40;

export const BMI_BUCKETS_KR = [
  {
    label: "저체중",
    min: -Infinity,
    max: 18.5,
    color: "#7AD4F7",
    range: "< 18.5",
    imgSrc: "/images/userinfo-images/bmi1.png",
  },
  {
    label: "정상",
    min: 18.5,
    max: 22.9,
    color: "#A2B535",
    range: "18.5 ~ 22.9",
    imgSrc: "/images/userinfo-images/bmi2.png",
  },
  {
    label: "비만전단계",
    min: 23.0,
    max: 24.9,
    color: "#FBD43B",
    range: "23.0 ~ 24.9",
    imgSrc: "/images/userinfo-images/bmi3.png",
  },
  {
    label: "1단계 비만",
    min: 25.0,
    max: 29.9,
    color: "#F4A351",
    range: "25.0 ~ 29.9",
    imgSrc: "/images/userinfo-images/bmi4.png",
  },
  {
    label: "2단계 비만",
    min: 30.0,
    max: 34.9,
    color: "#F86A3A",
    range: "30.0 ~ 34.9",
    imgSrc: "/images/userinfo-images/bmi5.png",
  },
  {
    label: "3단계 비만",
    min: 35.0,
    max: Infinity,
    color: "#8B0000",
    range: "≥ 35.0",
    imgSrc: "/images/userinfo-images/bmi6.png",
  },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function getBMICategory(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) return "-";
  if (bmi < 18.5) return "저체중";
  if (bmi <= 22.9) return "정상";
  if (bmi <= 24.9) return "비만전단계";
  if (bmi <= 29.9) return "1단계 비만";
  if (bmi <= 34.9) return "2단계 비만";
  return "3단계 비만";
}

export function buildSegments() {
  const total = DISPLAY_MAX - DISPLAY_MIN;
  let prevMax = DISPLAY_MIN;
  const segments = [];

  for (const b of BMI_BUCKETS_KR) {
    const intendedMax = Number.isFinite(b.max)
      ? clamp(b.max, DISPLAY_MIN, DISPLAY_MAX)
      : DISPLAY_MAX;

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

/**
 * 체중(kg)과 신장(cm)을 바탕으로 BMI를 계산합니다.
 * 백엔드 로직: weightKg / (heightM * heightM)
 * @param {number} weightKg - 체중 (kg)
 * @param {number} heightCm - 신장 (cm)
 * @returns {number|null} BMI 값 또는 계산 불가 시 null
 */
export function calculateBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);

  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return null;
  }
  const heightM = h / 100;
  // 소수점 둘째 자리까지 반올림 (백엔드와 동일하게)
  const bmi = w / (heightM * heightM);
  return bmi;
}

/**
 * 미플린-세인트 조르 공식을 사용해 기초대사량(BMR)을 계산합니다.
 * 백엔드 로직: calculateBMR
 * @param {number} weightKg - 체중 (kg)
 * @param {number} heightCm - 신장 (cm)
 * @param {number} age - 나이
 * @param {'MALE' | 'FEMALE'} gender - 성별
 * @returns {number|null} BMR 값 또는 계산 불가 시 null
 */
export function calculateBMR(weightKg, heightCm, age, gender) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  const a = Number(age);

  if (
    !Number.isFinite(w) ||
    !Number.isFinite(h) ||
    !Number.isFinite(a) ||
    w <= 0 || h <= 0 || a <= 0
  ) {
    return null;
  }

  // (10 * weightKg + 6.25 * heightCm - 5 * age)
  let bmr = 10 * w + 6.25 * h - 5 * a;

  if (gender === "MALE") {
    bmr += 5;
  } else if (gender === "FEMALE") {
    bmr -= 161;
  } else {
    // 성별 정보가 없을 경우, 남성/여성 값의 평균에 가까운 남성 값을 기준으로 처리하거나 null 반환
    // 여기서는 일단 남성 기준으로 처리합니다.
    bmr += 5;
  }

  return bmr;
}

function dedupeSorted(nums, eps = 1e-6) {
  const out = [];
  for (const v of nums.sort((a, b) => a - b)) {
    if (out.length === 0 || Math.abs(out[out.length - 1] - v) > eps)
      out.push(v);
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

  return vals.map((v) => ({
    v,
    leftPct: toPct(v),
    strong: true, // 경계는 강조
  }));
}
export function positionArrow(bmi) {
  if (bmi == null || !Number.isFinite(bmi))
    return { show: false, leftPct: 0, clamped: false };
  const c = clamp(bmi, DISPLAY_MIN, DISPLAY_MAX);
  return {
    show: true,
    leftPct: ((c - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 100,
    clamped: c !== bmi,
  };
}
