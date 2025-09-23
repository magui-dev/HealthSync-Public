// ActivityLevelChart.jsx
import React, { useMemo } from "react";
import styles from "./ActivityLevelChart.module.css";
import {
  buildActivitySegments,
  LEVEL_POINTERS,
  positionLevelPointer
} from "../hooks/activityLevel";

export default function ActivityLevelChart({ level, pointerImages = null }) {
  const segments = useMemo(() => buildActivitySegments(), []);
  const pointer  = useMemo(() => positionLevelPointer(level), [level]);

  // 넘어온 pointerImages가 있으면 그걸 쓰고, 없으면 기본 맵 사용
  const POINTERS   = pointerImages ?? LEVEL_POINTERS;
  const pointerSrc = POINTERS?.[level];

  return (
    <div className={`${styles.activityChartContainer} ${styles.v_chevron}`} aria-label="활동 지수 차트">
      {pointer.show && pointerSrc && (
        <div className={styles.activityPointerWrap} style={{ left: `${pointer.leftPct}%` }}>
          <img src={pointerSrc} alt={`활동 지수 ${level}`} className={styles.activityPointerIcon} />
        </div>
      )}

      <div className={styles.activityBar} role="list">
        {segments.map((s) => {
          const isActive = level === s.key;
          return (
            <div
              key={s.key}
              role="listitem"
              className={`${styles.activitySegment} ${isActive ? styles.active : ""}`}
              style={{ backgroundColor: s.color }}
              title={`${s.label} (${s.desc}, × ${s.factor})`}
              aria-current={isActive ? "true" : "false"}
            >
              <div className={styles.activitySegmentInner}>
                <div className={styles.activityLabel}>{s.label}</div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
