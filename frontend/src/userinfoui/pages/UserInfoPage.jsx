// // userinfoui/pages/UserInfoPage.js

// import React, { useMemo } from "react";
// import styles from "./UserInfoPage.module.css";
// import BmiChart from "../components/BmiChart";
// import { buildActivitySegments } from "../hooks/activityLevel";
// import ActivityLevelChart from "../components/ActivityLevelChart";
// import { useMe } from "../../hooks/useMe";
// import { getBMICategory, calculateBMI, calculateBMR } from "../hooks/bmi.js";

// const DEFAULT_IMAGE_PATH = "/images/profile-images/default.png";

// const API_ORIGIN =
//   (import.meta?.env && import.meta.env.VITE_API_ORIGIN) ||
//   "http://localhost:8080";

// function resolveImageUrl(u) {
//   if (!u) return null;
//   if (/^https?:\/\//i.test(u)) return u;
//   if (/^images\//i.test(u)) u = "/" + u;
//   if (u.startsWith("/images/")) return u;
//   if (u.startsWith("/")) return API_ORIGIN + u;
//   return `${API_ORIGIN}/${u}`;
// }

// function withQuery(url, key, val) {
//   if (!url) return url;
//   const u = /^https?:\/\//i.test(url)
//     ? new URL(url)
//     : new URL(url, window.location.origin);
//   u.searchParams.set(key, String(val));
//   return u.toString();
// }

// function makeAvatarSrc(url, updatedAt) {
//   const base = resolveImageUrl(url) || DEFAULT_IMAGE_PATH;
//   if (!updatedAt) return base;
//   const ms = Date.parse(updatedAt);
//   if (Number.isNaN(ms)) return base;
//   return withQuery(base, "v", ms);
// }

// // 닉네임을 안전하게 가져오는 함수
// const pickNickname = (obj) => {
//   const flat =
//     obj?.authorNickname ??
//     obj?.nickname ??
//     obj?.userNickname ??
//     obj?.writerNickname ??
//     obj?.memberNickname ??
//     obj?.authorName ??
//     obj?.name ??
//     null;
//   if (flat) return String(flat);
//   const nested =
//     obj?.author?.nickname ??
//     obj?.author?.name ??
//     obj?.user?.nickname ??
//     obj?.user?.name ??
//     obj?.writer?.nickname ??
//     obj?.writer?.name ??
//     obj?.member?.nickname ??
//     obj?.member?.name ??
//     null;
//   return nested ? String(nested) : null;
// };
// // ▲▲▲▲▲ 여기까지 PostDetail.js에서 가져온 코드 ▲▲▲▲▲

// /* ===== PlanReport.jsx에서 가져온 헬퍼 함수 및 컴포넌트 ===== */
// const fmt = (n, d = 0) =>
//   (n ?? n === 0) && Number.isFinite(Number(n))
//     ? Number(n).toLocaleString(undefined, { maximumFractionDigits: d })
//     : "-";

// function Pill({ label, value, sub, tone = "gray" }) {
//   const colors = {
//     gray: { bg: "#f3f4f6", fg: "#111827", br: "#e5e7eb" },
//     blue: { bg: "#eef2ff", fg: "#1e3a8a", br: "#e5e7eb" },
//     // 필요하다면 다른 색상도 추가 가능
//   };
//   const { bg, fg, br } = colors[tone] ?? colors.gray;
//   return (
//     <span style={{
//       display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
//       borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 600, border: `1px solid ${br}`
//     }}>
//       <span style={{ opacity: .85 }}>{label}</span>
//       <span style={{ fontWeight: 700 }}>{value}</span>
//       {sub ? <span style={{ opacity: .85 }}>{sub}</span> : null}
//     </span>
//   );
// }


// export default function UserInfoPage({ userProfile, userMetrics, planData, summaryData }) {
//   const { me } = useMe();
//   const activitySegments = useMemo(() => buildActivitySegments(), []);

//   const dailyKcalResolved = useMemo(
//     () => summaryData?.targetDailyCalories ?? summaryData?.target_daily_kcal ?? summaryData?.dailyKcal ?? null,
//     [summaryData]
//   );

//   const displayData = useMemo(() => {
//     if (!userProfile || !userMetrics || !planData || !summaryData) {
//       return null;
//     }

//     const currentWeight = planData.startWeightKg; // 목표의 시작 체중을 사용
//     const calculatedBmi = calculateBMI(currentWeight, userProfile.height);
//     const calculatedBmr = calculateBMR(
//       currentWeight,
//       userProfile.height,
//       userProfile.age,
//       userProfile.gender // 'MALE' 또는 'FEMALE' 원본 값
//     );

//     return {
//       // 1. userProfile에서 오는 기본 정보
//       nickname: me?.nickname || me?.name || "사용자",
//       profileImageUrl: makeAvatarSrc(
//         userProfile.profileImageUrl,
//         userProfile.profileImageUpdatedAt
//       ),
//       height: userProfile.height,
//       gender: userProfile.gender === "MALE" ? "남성" : userProfile.gender === "FEMALE" ? "여성" : "미지정",
//       age: userProfile.age,
//       activityLevel: userProfile.activityLevel,

//       // 2. userMetrics에서 오는 계산된 건강 지표
//       bmi: calculatedBmi ?? 0, // null일 경우 기본값 0
//       basalMetabolism: calculatedBmr ?? 0, // null일 경우 기본값 0
//       bmiCategory: getBMICategory(calculatedBmi),
//       // 3. planData에서 오는 목표 정보
//       type: planData.type,
//       duration: { weeks: planData.weeks },
//       startDate: planData.startDate,
//       endDate: planData.endDate,
//       startWeightKg: planData.startWeightKg,
//       targetWeightKg: planData.targetWeightKg,
//     };
//   }, [userProfile, userMetrics, planData, me]);

//   if (!displayData) {
//     // 이 메시지는 보통 보이지 않아야 합니다 (부모가 데이터를 다 받은 후에 렌더링하므로)
//     return <div className={styles.container}>정보를 표시할 수 없습니다.</div>;
//   }

//   // ✅ 데이터가 모두 준비되었을 때, 기존과 동일하게 UI를 렌더링합니다.
//   return (
//     <div className={styles.background}>
//       <div className={styles.container}>
//         <div className={styles.dashboardHeader}>
//           {/* 1. 왼쪽: 프로필 영역 */}
//           <div className={styles.profileColumn}>
//             <img
//               src={displayData.profileImageUrl}
//               alt={`${displayData.nickname}의 프로필 이미지`}
//               className={styles.avatar}
//               onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_PATH; }}
//             />
//             <div>
//               <h2 className={styles.nickname}>{displayData.nickname} 님</h2>
//               {/* 👇 [수정] subInfo를 감싸는 컨테이너와 개별 아이템으로 변경 */}
//               <div className={styles.subInfoContainer}>
//                 <span className={styles.subInfoItem}>성별: {displayData.gender}</span>
//                 <span className={styles.subInfoItem}>나이: {displayData.age}세</span>
//                 <span className={styles.subInfoItem}>키: {displayData.height}cm</span>
//               </div>
//             </div>
//           </div>

//           {/* ===== 2. 중앙: 목표 & TDEE 컬럼 ===== */}
//           <div className={styles.centerColumn}>
//             {/* 중앙-위: 목표 체중 */}
//             <div className={styles.goalInfo}>
//               <span className={styles.metricLabel}>목표 체중</span>
//               <div className={styles.weightChange}>
//                 <span>{displayData.startWeightKg.toFixed(1)}<small>kg</small></span>
//                 <span className={styles.arrowIcon}>→</span>
//                 <strong>{displayData.targetWeightKg.toFixed(1)}<small>kg</small></strong>
//               </div>
//               <p className={styles.goalPeriod}>
//                 {displayData.duration.weeks}주 목표 ({new Date(displayData.startDate).toLocaleDateString("ko-KR", { month: '2-digit', day: '2-digit' })} ~ {new Date(displayData.endDate).toLocaleDateString("ko-KR", { month: '2-digit', day: '2-digit' })})
//               </p>
//             </div>

//             {/* 중앙-아래: TDEE */}
//             <div className={styles.metricItem}>
//               <span className={styles.metricLabel}>TDEE (활동대사량)</span>
//               <span className={styles.metricValue}>
//                 {fmt(userMetrics?.dailyCalories)} <small>kcal/일</small> {/* ◀ 이렇게 수정 */}
//               </span>
//             </div>
//           </div>
          
//           {/* ===== 3. 오른쪽: 핵심 지표 컬럼 ===== */}
//           <div className={styles.metricsColumn}>
//             {/* 오른쪽-위: BMI & BMR */}
//             <div className={styles.topMetricsRow}>
//               <div className={styles.metricItem}>
//                 <span className={styles.metricLabel}>BMI</span>
//                 <span className={styles.metricValue}>{displayData.bmi.toFixed(1)}</span>
//               </div>
//               <div className={styles.metricItem}>
//                 <span className={styles.metricLabel}>BMR (기초대사량)</span>
//                 <span className={styles.metricValue}>
//                   {fmt(displayData.basalMetabolism)} <small>kcal</small>
//                 </span>
//               </div>
//             </div>

//             {/* 오른쪽-아래: 권장 섭취량 */}
//             <div className={styles.metricItemHighlight}>
//               <span className={styles.metricLabel}>일일 권장 섭취량</span>
//               <span className={styles.metricValue}>
//                 {fmt(dailyKcalResolved)} <small>kcal</small>
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Bmi 그래프 */}
//         <BmiChart bmi={displayData.bmi} />

//         <div className={styles.section}>
//           <p className={styles.noteText}>
//             <span className={styles.noteMark}>※</span>이 프로그램에서는{" "}
//             미플린–세인트 조르 공식을 사용해 BMR을 계산합니다.
//           </p>
//         </div>

//         <div className={styles.activitySection}>
//           <div className={styles.sectionTitleContainer}>
//             <h3>활동 지수</h3>
//             <span
//               className={styles.levelBadge}
//               style={{
//                 backgroundColor:
//                   activitySegments.find(
//                     (s) => s.key === Number(displayData.activityLevel)
//                   )?.color || "#ccc",
//               }}
//             >
//               {displayData.activityLevel}
//             </span>
//           </div>
//           <ActivityLevelChart level={displayData.activityLevel} />
//           <ul className={styles.activityLegend}>
//             {activitySegments.map((segment) => (
//               <li
//                 key={segment.key}
//                 className={`${styles.activityListItem} ${Number(displayData.activityLevel) === segment.key
//                   ? styles.active
//                   : ""
//                   }`}
//               >
//                 <strong className={styles.itemLevelPrefix}>
//                   {`Level${segment.key}`}
//                 </strong>
//                 <span className={styles.itemDescription}>
//                   {`${segment.desc} (계수: × ${segment.factor})`}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>

//       </div>
//     </div>
//   );
// }

// userinfoui/pages/UserInfoPage.js

// userinfoui/pages/UserInfoPage.js
// userinfoui/pages/UserInfoPage.js

import React, { useMemo } from "react";
import styles from "./UserInfoPage.module.css";
import BmiChart from "../components/BmiChart";
import { buildActivitySegments } from "../hooks/activityLevel";
import ActivityLevelChart from "../components/ActivityLevelChart";

// Helper functions (사용자님의 원본 코드와 동일)
const DEFAULT_IMAGE_PATH = "/images/profile-images/default.png";
const API_ORIGIN = (import.meta?.env && import.meta.env.VITE_API_ORIGIN) || "http://localhost:8080";
function resolveImageUrl(u) { if (!u) return null; if (/^https?:\/\//i.test(u)) return u; if (/^images\//i.test(u)) u = "/" + u; if (u.startsWith("/images/")) return u; if (u.startsWith("/")) return API_ORIGIN + u; return `${API_ORIGIN}/${u}`; }
function withQuery(url, key, val) { if (!url) return url; const u = /^https?:\/\//i.test(url) ? new URL(url) : new URL(url, window.location.origin); u.searchParams.set(key, String(val)); return u.toString(); }
function makeAvatarSrc(url, updatedAt) { const base = resolveImageUrl(url) || DEFAULT_IMAGE_PATH; if (!updatedAt) return base; const ms = Date.parse(updatedAt); if (Number.isNaN(ms)) return base; return withQuery(base, "v", ms); }
const fmt = (n, d = 0) => (n ?? n === 0) && Number.isFinite(Number(n)) ? Number(n).toLocaleString(undefined, { maximumFractionDigits: d }) : "-";


// ✅ Props를 통합된 reportData 하나만 받도록 변경
export default function UserInfoPage({ reportData }) {
  const activitySegments = useMemo(() => buildActivitySegments(), []);

  if (!reportData) {
    return <div className={styles.container}>표시할 리포트 데이터가 없습니다.</div>;
  }

  // 화면 표시에 필요한 값들을 간단히 정의
  const genderText = reportData.gender === "MALE" ? "남성" : reportData.gender === "FEMALE" ? "여성" : "미지정";
  const profileImageUrl = makeAvatarSrc(reportData.profileImageUrl, reportData.profileImageUpdatedAt);
  const endDateText = reportData.endDate ? new Date(reportData.endDate).toLocaleDateString("ko-KR", { month: '2-digit', day: '2-digit' }) : "-";
  const goalPeriodText = `${reportData.weeks}주 목표 (${new Date(reportData.startDate).toLocaleDateString("ko-KR", { month: '2-digit', day: '2-digit' })} ~ ${endDateText})`;

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <div className={styles.dashboardHeader}>
          {/* 프로필 영역 */}
          <div className={styles.profileColumn}>
            <img src={profileImageUrl} alt={`${reportData.nickname}의 프로필 이미지`} className={styles.avatar} onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_PATH; }} />
            <div>
              <h2 className={styles.nickname}>{reportData.nickname} 님</h2>
              <div className={styles.subInfoContainer}>
                <span className={styles.subInfoItem}>성별: {genderText}</span>
                <span className={styles.subInfoItem}>나이: {reportData.age}세</span>
                <span className={styles.subInfoItem}>키: {reportData.height}cm</span>
              </div>
            </div>
          </div>
          {/* 목표 & TDEE 컬럼 */}
          <div className={styles.centerColumn}>
            <div className={styles.goalInfo}>
              <span className={styles.metricLabel}>목표 체중</span>
              <div className={styles.weightChange}>
                <span>{(reportData.startWeightKg || 0).toFixed(1)}<small>kg</small></span>
                <span className={styles.arrowIcon}>→</span>
                <strong>{(reportData.targetWeightKg || 0).toFixed(1)}<small>kg</small></strong>
              </div>
              <p className={styles.goalPeriod}>{goalPeriodText}</p>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>TDEE (활동대사량)</span>
              <span className={styles.metricValue}>{fmt(reportData.dailyCalories)} <small>kcal/일</small></span>
            </div>
          </div>
          {/* 핵심 지표 컬럼 */}
          <div className={styles.metricsColumn}>
            <div className={styles.topMetricsRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>BMI</span>
                <span className={styles.metricValue}>{(reportData.bmi || 0).toFixed(1)}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>BMR (기초대사량)</span>
                <span className={styles.metricValue}>{fmt(reportData.basalMetabolism)} <small>kcal</small></span>
              </div>
            </div>
            <div className={styles.metricItemHighlight}>
              <span className={styles.metricLabel}>일일 권장 섭취량</span>
              <span className={styles.metricValue}>{fmt(reportData.targetDailyCalories)} <small>kcal</small></span>
            </div>
          </div>
        </div>
        <BmiChart bmi={reportData.bmi} />
        <div className={styles.section}>
          <p className={styles.noteText}>
            <span className={styles.noteMark}>※</span>이 프로그램에서는 미플린–세인트 조르 공식을 사용해 BMR을 계산합니다.
          </p>
        </div>
        {/* 활동 지수 */}
        <div className={styles.activitySection}>
          <div className={styles.sectionTitleContainer}>
            <h3>활동 지수</h3>
            <span className={styles.levelBadge} style={{ backgroundColor: activitySegments.find((s) => s.key === Number(reportData.activityLevel))?.color || "#ccc" }}>
              {reportData.activityLevel}
            </span>
          </div>
          <ActivityLevelChart level={reportData.activityLevel} />
          {/* ✅ 사용자님의 원래 코드에 있던 활동 지수 범례(legend) 코드 복구 */}
          <ul className={styles.activityLegend}>
            {activitySegments.map((segment) => (
              <li key={segment.key} className={`${styles.activityListItem} ${Number(reportData.activityLevel) === segment.key ? styles.active : ""}`}>
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