// userinfoui/pages/UserInfoPage.js

import React, { useMemo } from "react";
import styles from "./UserInfoPage.module.css";
import UserInfo from "../components/UserInfo";
import BmiChart from "../components/BmiChart";
import { getBMICategory } from "../hooks/bmi.js";
import { buildActivitySegments } from "../hooks/activityLevel";
import ActivityLevelChart from "../components/ActivityLevelChart";

export default function UserInfoPage({ userProfile, userMetrics, planData }) {
  const activitySegments = useMemo(() => buildActivitySegments(), []);

  const displayData = useMemo(() => {
     if (!userProfile || !userMetrics || !planData) {
      return null;
    }

    return {
      // 1. userProfile에서 오는 기본 정보
      nickname: userProfile.nickname || "사용자",
      height: userProfile.height,
      weight: userProfile.weight,
      gender: userProfile.gender === "MALE" ? "남성" : userProfile.gender === "FEMALE" ? "여성" : "미지정",
      age: userProfile.age,
      activityLevel: userProfile.activityLevel,

      // 2. userMetrics에서 오는 계산된 건강 지표
     bmi: userMetrics.bmi,
      basalMetabolism: userMetrics.bmr,
      bmiCategory: getBMICategory(userMetrics.bmi),

      // 3. planData에서 오는 목표 정보
       type: planData.type,
      duration: { weeks: planData.weeks },
      startDate: planData.startDate,
      endDate: planData.endDate,
      startWeightKg: planData.startWeightKg,
      targetWeightKg: planData.targetWeightKg,
    };
  }, [userProfile, userMetrics, planData]);

  if (!displayData) {
    // 이 메시지는 보통 보이지 않아야 합니다 (부모가 데이터를 다 받은 후에 렌더링하므로)
    return <div className={styles.container}>정보를 표시할 수 없습니다.</div>;
  }

  // ✅ 데이터가 모두 준비되었을 때, 기존과 동일하게 UI를 렌더링합니다.
  return (
    <div className={styles.background}>
      <div className={styles.container}>
       <UserInfo user={displayData} />
        
        <BmiChart bmi={displayData.bmi} />
        
        <div className={styles.section}>
          <p className={styles.noteText}>
            <span className={styles.noteMark}>※</span>이 프로그램에서는{" "}
            미플린–세인트 조르 공식을 사용해 BMR을 계산합니다.
          </p>
        </div>

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
       
        </div>
      </div>
  );
}