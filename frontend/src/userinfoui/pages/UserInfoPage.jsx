import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import styles from "./UserInfoPage.module.css";
import UserInfo from "../components/UserInfo";
import BmiChart from "../components/BmiChart";
import { getBMICategory } from "../hooks/bmi.js";
import ActivityLevelChart from "../components/ActivityLevelChart";

// ====== 계산 유틸 ======
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

export default function UserInfoPage() {
  const { me, loading: meLoading } = useMe();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!meLoading && me) {
      (async () => {
        try {
          const res = await axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
          setProfile(res.data);
        } catch (err) {
          console.error("프로필 불러오기 실패", err);
        } finally {
          setPageLoading(false);
        }
      })();
    } else if (!meLoading && !me) {
      setPageLoading(false);
    }
  }, [me, meLoading]);

  if (pageLoading) return <div className={styles.container}>로딩 중...</div>;
  if (!me || !profile) {
    return (
      <div className={styles.container}>
        로그인이 필요하거나 프로필 정보를 불러올 수 없습니다.
      </div>
    );
  }

  // 성별 통일
  const genderEnum =
    profile.gender?.trim?.().toUpperCase() === "MALE"
      ? "MALE"
      : profile.gender?.trim?.().toUpperCase() === "FEMALE"
      ? "FEMALE"
      : null;

  // 계산 (백엔드 값 있으면 우선 사용, 없으면 계산)
  const bmi =
    profile && Number.isFinite(Number(profile.bmi))
      ? Number(profile.bmi)
      : calcBMI(profile?.weight, profile?.height);

  const bmr =
    profile && Number.isFinite(Number(profile.basalMetabolism))
      ? Number(profile.basalMetabolism)
      : calcBMR(profile?.weight, profile?.height, profile?.age, genderEnum);

  const displayData = {
    nickname: me.nickname,
    height: profile.height,
    weight: profile.weight,
    gender:
      genderEnum === "MALE"
        ? "남성"
        : genderEnum === "FEMALE"
        ? "여성"
        : "미지정",
    age: profile.age,
    activityLevel: profile.activityLevel,
    bmi: bmi,
    basalMetabolism: bmr,
    bmiCategory: getBMICategory(bmi),
    targetPeriod: "4주 (2025.09.22 ~ 2025.10.19)",
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <UserInfo user={displayData} />

        <div className={styles.section}>
          <p>
            이 프로그램에서는 <strong>미플린–세인트 조르 공식</strong>을 사용해
            BMR을 계산합니다.
          </p>
        </div>

        <BmiChart bmi={displayData.bmi} />

        <div className={styles.section}>
          <h3>활동 지수 {displayData.activityLevel}</h3>
          <div style={{ marginTop: 55 }}></div>
          <ActivityLevelChart level={displayData.activityLevel} />

          <ol className={styles.activityList}>
            <li>사무직 (운동 거의 없음) = × 0.2</li>
            <li>가벼운 운동 주 2회 = × 0.3</li>
            <li>중간 강도 운동 주 3~5일 = × 0.5</li>
            <li>고강도 운동 주 6~7일 = × 0.7</li>
          </ol>
        </div>

        <div className={styles.targetPeriod}>
          목표 기간 : {displayData.targetPeriod}
        </div>
      </div>
    </div>
  );
}
