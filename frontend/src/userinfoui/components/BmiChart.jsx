import React, { useMemo } from "react";
import styles from "./BmiChart.module.css";
// ✅ getBMICategory 함수를 가져와야 합니다. (이미 가져오고 있다면 생략)
import { buildSegments, buildBoundaryTicks, positionArrow, BMI_BUCKETS_KR } from "../hooks/bmi";


export default function BmiChart({ bmi }) {
  const segments = useMemo(() => buildSegments(), []);
  const boundaryTicks = useMemo(() => buildBoundaryTicks(), []);
  const arrow = useMemo(() => positionArrow(bmi), [bmi]);

  // ✅ 현재 BMI에 해당하는 카테고리 정보 (이미지 소스를 가져오기 위함)
  const currentBmiCategory = useMemo(() => {
    if (bmi == null || !Number.isFinite(bmi)) return null;
    return BMI_BUCKETS_KR.find(
      (bucket) => bmi >= bucket.min && bmi <= bucket.max
    );
  }, [bmi]);

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
                {Number(bmi).toFixed(1)}
                {arrow.clamped && (
                  <span className={styles.bmiClampNote}> (범위 밖)</span>
                )}
              </div>
              {/* ② 아이콘(화살표 위에 위치) - ✅ 여기를 수정합니다. */}
              {currentBmiCategory && currentBmiCategory.imgSrc && (
                <img
                  src={currentBmiCategory.imgSrc} // ✅ 동적으로 이미지 경로 설정
                  alt={`${currentBmiCategory.label} 아이콘`} // ✅ alt 텍스트도 동적으로
                  className={styles.bmiArrowIcon}
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

        <div className={styles.bmiScaleFine}>
          {boundaryTicks.map((t) => (
            <div
              key={t.v}
              className={styles.bmiScaleTick}
              style={{ left: `${t.leftPct}%` }}
            >
              <span
                className={styles.bmiScaleTickLine}
                style={{
                  height: t.strong ? "12px" : "8px",
                  opacity: t.strong ? 1 : 0.6,
                }}
              />
              <span
                className={styles.bmiScaleTickLabel}
                style={{ fontWeight: t.strong ? 700 : 400 }}
              >
                {Number.isInteger(t.v) ? t.v : t.v.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}