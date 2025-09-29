// userinfoui/pages/UserInfoPage.js

import React, { useMemo } from "react";
import styles from "./UserInfoPage.module.css";
import BmiChart from "../components/BmiChart";
import { buildActivitySegments } from "../hooks/activityLevel";
import ActivityLevelChart from "../components/ActivityLevelChart";

// Helper functions (사용자님의 원본 코드와 동일)
const DEFAULT_IMAGE_PATH = "/images/profile-images/default.png";
const API_ORIGIN =
  (import.meta?.env && import.meta.env.VITE_API_ORIGIN) ||
  "http://localhost:8080";
function resolveImageUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^images\//i.test(u)) u = "/" + u;
  if (u.startsWith("/images/")) return u;
  if (u.startsWith("/")) return API_ORIGIN + u;
  return `${API_ORIGIN}/${u}`;
}
function withQuery(url, key, val) {
  if (!url) return url;
  const u = /^https?:\/\//i.test(url)
    ? new URL(url)
    : new URL(url, window.location.origin);
  u.searchParams.set(key, String(val));
  return u.toString();
}
function makeAvatarSrc(url, updatedAt) {
  const base = resolveImageUrl(url) || DEFAULT_IMAGE_PATH;
  if (!updatedAt) return base;
  const ms = Date.parse(updatedAt);
  if (Number.isNaN(ms)) return base;
  return withQuery(base, "v", ms);
}
const fmt = (n, d = 0) =>
  (n ?? n === 0) && Number.isFinite(Number(n))
    ? Number(n).toLocaleString(undefined, { maximumFractionDigits: d })
    : "-";

const goalTypeConfig = {
  LEAN: { text: "체중감량", color: "#dc2626", backgroundColor: "#fee2e2" },
  HEALTH: { text: "건강관리", color: "#16a34a", backgroundColor: "#f0fdf4" },
};

// ✅ Props를 통합된 reportData 하나만 받도록 변경
export default function UserInfoPage({ reportData }) {
  const activitySegments = useMemo(() => buildActivitySegments(), []);

  // ✅ [진단] 이 부분을 추가해서 reportData와 reportData.type 값을 확인해보세요.
  console.log("전달받은 reportData:", reportData);
  console.log("reportData.type의 실제 값:", reportData?.type);

  if (!reportData) {
    return (
      <div className={styles.container}>표시할 리포트 데이터가 없습니다.</div>
    );
  }

  // 화면 표시에 필요한 값들을 간단히 정의
  const genderText =
    reportData.gender === "MALE"
      ? "남성"
      : reportData.gender === "FEMALE"
      ? "여성"
      : "미지정";
  const profileImageUrl = makeAvatarSrc(
    reportData.profileImageUrl,
    reportData.profileImageUpdatedAt
  );
  const endDateText = reportData.endDate
    ? new Date(reportData.endDate).toLocaleDateString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
      })
    : "-";
  const goalPeriodText = `${reportData.weeks}주 목표 (${new Date(
    reportData.startDate
  ).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  })} ~ ${endDateText})`;

  // 목표 타입 정보를 가져옵니다. (기존 로직 그대로 사용)
  const currentGoalType = goalTypeConfig[reportData.type] || {
    text: "목표",
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <div className={styles.dashboardHeader}>
          {/* 프로필 영역 */}
          <div className={styles.profileColumn}>
            <img
              src={profileImageUrl}
              alt={`${reportData.nickname}의 프로필 이미지`}
              className={styles.avatar}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE_PATH;
              }}
            />
            <div>
              <h2 className={styles.nickname}>{reportData.nickname} 님</h2>
              <div className={styles.subInfoContainer}>
                <span className={styles.subInfoItem}>성별: {genderText}</span>
                <span className={styles.subInfoItem}>
                  나이: {reportData.age}세
                </span>
                <span className={styles.subInfoItem}>
                  키: {reportData.height}cm
                </span>
              </div>
            </div>
          </div>
          {/* 목표 & TDEE 컬럼 */}
          <div className={styles.centerColumn}>
            <div className={styles.goalInfo}>
                <div className={styles.goalTitleRow}>
    <span className={styles.metricLabel}>목표 체중</span>
    <span
      className={styles.goalTypeBadge}
      style={{
        color: currentGoalType.color,
        backgroundColor: currentGoalType.backgroundColor,
      }}
    >
      {currentGoalType.text}
    </span>
  </div>
              <div className={styles.weightChange}>
                <span className={styles.start}>
    {(reportData.startWeightKg || 0).toFixed(1)}<small>kg</small>
  </span>
                <span className={styles.arrowIcon}>→</span>
                 <strong className={styles.target}>
    {(reportData.targetWeightKg || 0).toFixed(1)}<small>kg</small>
  </strong>
              </div>
              <p className={styles.goalPeriod}>{goalPeriodText}</p>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>TDEE (활동대사량)</span>
              <span className={styles.metricValue}>
                {fmt(reportData.dailyCalories)} <small>kcal/일</small>
              </span>
            </div>
          </div>
          {/* 핵심 지표 컬럼 */}
          <div className={styles.metricsColumn}>
            <div className={styles.topMetricsRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>BMI</span>
                <span className={styles.metricValue}>
                  {(reportData.bmi || 0).toFixed(1)}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>BMR (기초대사량)</span>
                <span className={styles.metricValue}>
                  {fmt(reportData.basalMetabolism)} <small>kcal</small>
                </span>
              </div>
            </div>
            <div className={styles.metricItemHighlight}>
              <span className={styles.metricLabel}>일일 권장 섭취량</span>
              <span className={styles.metricValue}>
                {fmt(reportData.targetDailyCalories)} <small>kcal</small>
              </span>
            </div>
          </div>
        </div>
        <BmiChart bmi={reportData.bmi} />
        <div className={styles.section}>
          <p className={styles.noteText}>
            <span className={styles.noteMark}>※</span>이 프로그램에서는
            미플린–세인트 조르 공식을 사용해 BMR을 계산합니다.
          </p>
        </div>
        {/* 활동 지수 */}
        <div className={styles.activitySection}>
          <div className={styles.sectionTitleContainer}>
            <h3>활동 지수</h3>
            <span
              className={styles.levelBadge}
              style={{
                backgroundColor:
                  activitySegments.find(
                    (s) => s.key === Number(reportData.activityLevel)
                  )?.color || "#ccc",
              }}
            >
              {reportData.activityLevel}
            </span>
          </div>
          <ActivityLevelChart level={reportData.activityLevel} />
          {/* ✅ 사용자님의 원래 코드에 있던 활동 지수 범례(legend) 코드 복구 */}
          <ul className={styles.activityLegend}>
            {activitySegments.map((segment) => (
              <li
                key={segment.key}
                className={`${styles.activityListItem} ${
                  Number(reportData.activityLevel) === segment.key
                    ? styles.active
                    : ""
                }`}
              >
                <strong className={styles.itemLevelPrefix}>
                  {`Level${segment.key}`}
                </strong>
                <span className={styles.itemDescription}>
                  {`${segment.desc} (계수: × ${segment.factor})`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
