// userinfoui/pages/UserInfoPage.js

import React, { useMemo } from "react";
import styles from "./UserInfoPage.module.css";
import UserInfo from "../components/UserInfo";
import BmiChart from "../components/BmiChart";
import { getBMICategory } from "../hooks/bmi.js";
import ActivityLevelChart from "../components/ActivityLevelChart";
import { buildActivitySegments } from "../hooks/activityLevel";

// 계산 유틸은 그대로 사용
function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Number((weightKg / (h * h)).toFixed(2));
}

function calcBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age || !gender) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "MALE"
    ? Number((base + 5).toFixed(2))
    : Number((base - 161).toFixed(2));
}

export default function UserInfoPage({ report }) {
  const activitySegments = useMemo(() => buildActivitySegments(), []);

  if (!report) {
    return (
      <div className={styles.container}>왼쪽에서 목표를 선택해주세요.</div>
    );
  }

  const genderEnum =
    report.gender?.trim?.().toUpperCase() === "MALE"
      ? "MALE"
      : report.gender?.trim?.().toUpperCase() === "FEMALE"
      ? "FEMALE"
      : null;
  const bmi =
    report && Number.isFinite(Number(report.bmi))
      ? Number(report.bmi)
      : calcBMI(report?.weight, report?.height);
  const bmr =
    report && Number.isFinite(Number(report.basalMetabolism))
      ? Number(report.basalMetabolism)
      : calcBMR(report?.weight, report?.height, report?.age, genderEnum);
  const displayData = {
    nickname: report.nickname,
    height: report.height,
    weight: report.weight,
    gender:
      genderEnum === "MALE"
        ? "남성"
        : genderEnum === "FEMALE"
        ? "여성"
        : "미지정",
    age: report.age,
    activityLevel: report.activityLevel,
    bmi: bmi,
    basalMetabolism: bmr,
    bmiCategory: getBMICategory(bmi),
    targetPeriod: report.targetPeriod,
  };

  return (
    <div className={styles.background}>
      {/* ✅ 모든 내용은 이 container div 안에 있어야 합니다. */}
      <div className={styles.container}>
        <UserInfo user={displayData} />

        <div className={styles.section}>
          <p className={styles.noteText}>
            <span className={styles.noteMark}>※</span>이 프로그램에서는{" "}
            <strong>미플린–세인트 조르 공식</strong>을 사용해 BMR을 계산합니다.
          </p>
        </div>

        <BmiChart bmi={displayData.bmi} />

        {/* ✅ 활동 지수 관련 모든 요소를 activitySection div로 감쌌습니다. */}
        <div className={styles.activitySection}>
          <div className={styles.sectionTitleContainer}>
            <h3>활동 지수</h3>
            <span
              className={styles.levelBadge}
              style={{
                backgroundColor:
                  activitySegments.find(
                    (s) => s.key === Number(displayData.activityLevel)
                  )?.color || "#ccc",
              }}
            >
              {displayData.activityLevel}
            </span>
          </div>

          <ActivityLevelChart level={displayData.activityLevel} />

          {/* ✅ 목록(ul)을 section 안으로 가져왔습니다. */}
          <ul className={styles.activityLegend}>
            {activitySegments.map((segment) => (
              <li
                key={segment.key}
                className={`${styles.activityListItem} ${
                  Number(displayData.activityLevel) === segment.key
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

        {/* ✅ 목표 정보 섹션을 container div 안으로 가져왔습니다. */}
        <div className={styles.goalSection}>
          <h3 className={styles.sectionTitle}>목표 정보</h3>

          {/* infoCard 들을 감싸는 Grid 컨테이너 */}
          <div className={styles.infoCardGrid}>
            {/* 1. 목표 타입 카드 */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>🎯</div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>목표 타입</span>
                <span className={styles.cardValue}>
                  {report.type === "LEAN" ? "다이어트" : "건강 관리"}
                </span>
              </div>
            </div>

            {/* 2. 목표 기간 카드 */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>🗓️</div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>목표 기간</span>

                {/* ✅ 이 부분을 아래의 div와 두 개의 span으로 변경합니다. */}
                <div className={styles.cardValueContainer}>
                  <span className={styles.cardDuration}>
                    {report.duration.weeks}주
                  </span>
                  <span className={styles.cardDateRange}>
                    {report.startDate} ~ {report.endDate}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. 시작 체중 카드 */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>⚖️</div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>시작 체중</span>
                <span className={styles.cardValue}>
                  {report.startWeightKg} kg
                </span>
              </div>
            </div>

            {/* 4. 목표 체중 카드 (+ 진행률 바) */}
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>🏁</div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>목표 체중</span>
                <span className={styles.cardValue}>
                  {report.targetWeightKg} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* 여기가 container div의 끝입니다. */}
    </div>
  );
}
