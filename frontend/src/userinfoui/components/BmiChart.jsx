import React, { useMemo } from "react";
import styles from "./BmiChart.module.css";
// ✅ getBMICategory 함수를 가져와야 합니다. (이미 가져오고 있다면 생략)
import {
  buildSegments,
  positionArrow,
  BMI_BUCKETS_KR,
} from "../hooks/bmi";

export default function BmiChart({ bmi }) {
  // 1) 숫자 정규화
  const bmiNum = useMemo(() => {
    const n = Number(bmi);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 10) / 10; // ← ★ 핵심! 29.9999999 → 30.0
  }, [bmi]);

  const segments = useMemo(() => buildSegments(), []);
  const arrow = useMemo(() => positionArrow(bmiNum), [bmiNum]);

  // 2) 경계 안전 매칭: ε 보정 + [min, max) (마지막만 <=)
  const currentBmiCategory = useMemo(() => {
    if (bmiNum == null) return null;
    for (let i = 0; i < BMI_BUCKETS_KR.length; i++) {
      const b = BMI_BUCKETS_KR[i];
      const last = i === BMI_BUCKETS_KR.length - 1;
      if (bmiNum >= b.min && (last ? bmiNum <= b.max : bmiNum < b.max)) {
        return b;
      }
    }
    return null;
  }, [bmiNum]);

  return (
    <div className={styles.section}>
      <div className={styles.bmiChartContainer}>
        <div className={styles.bmiBar}>
          {segments.map((s) => (
            <div
              key={s.label}
              className={styles.bmiSegment}
              style={{ width: `${s.widthPct}%`, backgroundColor: s.color }}
              title={`${s.label} (${s.range})`}
            >
              <div className={styles.bmiSegmentLabel}>
                <span>{s.range}</span>
                <span>{s.label}</span>
              </div>
            </div>
          ))}

          {arrow.show && (
            <div
              className={styles.bmiArrowWrap}
              style={{ left: `${arrow.leftPct}%` }}
            >
              {/* ① 값 */}
              <div className={styles.bmiArrowValue}>
                {bmiNum?.toFixed(1)}
                {arrow.clamped && (
                  <span className={styles.bmiClampNote}> (범위 밖)</span>
                )}
              </div>
              {/* ② 아이콘(화살표 위에 위치) - ✅ 여기를 수정합니다. */}
              {currentBmiCategory?.imgSrc && (
                <img
                  src={currentBmiCategory.imgSrc} // ✅ 동적으로 이미지 경로 설정
                  alt={`${currentBmiCategory.label} 아이콘`} // ✅ alt 텍스트도 동적으로
                  className={styles.bmiArrowIcon}
                  onError={(e) => {
                    e.currentTarget.replaceWith(
                      Object.assign(document.createElement("div"), {
                        textContent: "이미지 404",
                        style:
                          "width:50px;height:60px;border:1px solid red;display:flex;align-items:center;justify-content:center;font-size:10px;background:#fff",
                      })
                    );
                  }}
                />
              )}
              {/* ③ ▼ 화살표(맨 아래, 막대 쪽) */}
              <svg
                className={styles.bmiArrowHead}
                width="12"
                height="14"
                viewBox="0 0 12 10"
                aria-hidden="true"
                focusable="false"
              >
                <polygon points="6,10 0,0 12,0" fill="#222" />
              </svg>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
