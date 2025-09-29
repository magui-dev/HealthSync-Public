// // AIWithReportPage.js

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useMe } from "../../hooks/useMe";
// import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
// import AIChatPage from "../components/AIChatPage";
// import GoalSelectModal from "../components/GoalSelectModal";
// import "./AIWithReportPage.css";

// export default function AIWithReportPage() {
//   const { me } = useMe();

//   const [userProfile, setUserProfile] = useState(null);
//   const [userMetrics, setUserMetrics] = useState(null);

//   // 💡 [핵심] 2개의 목표 데이터를 별도로 관리합니다.
//   const [selectedGoal, setSelectedGoal] = useState(null); // Modal에서 선택된 기본 목표 정보
//   const [planData, setPlanData] = useState(null); // /summary API로 받은 상세 분석 정보

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (me && me.userId) {
//       const fetchInitialData = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//           const profilePromise = axios.get("http://localhost:8080/profile", {
//             withCredentials: true,
//           });
//           const metricsPromise = axios.get(
//             `http://localhost:8080/calc/${me.userId}/latest`,
//             { withCredentials: true }
//           );
//           const [profileResponse, metricsResponse] = await Promise.all([
//             profilePromise,
//             metricsPromise,
//           ]);

//            console.log("### Profile API 응답:", profileResponse.data);
//           console.log("### Metrics API 응답:", metricsResponse.data);


//           setUserProfile(profileResponse.data);
//           setUserMetrics(metricsResponse.data);
//         } catch (err) {
//           console.error("초기 사용자 정보 로딩 실패:", err);
//           setError("사용자 정보를 불러오는 데 실패했습니다.");
//         }
//         // 💡 초기 로딩 완료 시점을 명확히 하기 위해 finally 제거
//         setLoading(false);
//       };
//       fetchInitialData();
//     }
//   }, [me]);

//   const handleSelectGoal = async (goal) => {
//     setLoading(true);
//     setError(null);
//     setSelectedGoal(goal); // ◀ GoalSelectModal에서 받은 goal 객체 저장 (startWeightKg 여기 있음!)
//     setPlanData(null);

//     try {
//       const res = await axios.get(`http://localhost:8080/api/plan/${goal.id}/summary`, {
//         withCredentials: true,
//       });
//       setPlanData(res.data);
      

//       // setPlanData(res.data); // ◀ 상세 분석 데이터 저장
//     } catch (err) {
//       console.error("플랜 데이터 불러오기 실패:", err);
//       setError("목표 계획을 불러오는 데 실패했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const combinedDataForChat =
//     userProfile && planData
//       ? {
//        // ✅ 백엔드 ReportContextDto의 필드명과 키 이름을 100% 일치시킵니다.

//           // --- userProfile에서 가져오는 정보 ---
//           gender: userProfile.gender,
//           age: userProfile.age,
//           height: userProfile.height,
//           activityLevel: userProfile.activityLevel,

//           // --- userMetrics에서 가져오는 정보 ---
//           bmi: userMetrics.bmi,
//           basalMetabolism: userMetrics.basalMetabolism,
//           dailyCalories: userMetrics.dailyCalories,

//           // --- planData와 selectedGoal에서 가져오는 정보 ---
//           startWeightKg: selectedGoal.startWeightKg, // startWeightKg는 selectedGoal에 있습니다.
//           targetWeightKg: planData.targetWeightKg,
//           weeks: planData.weeks,
//           startDate: planData.startDate,
//           endDate: planData.endDate,
//           targetDailyCalories: planData.targetDailyCalories,

//           // --- me 객체에서 가져오는 정보 ---
//           nickname: me?.nickname,
//         }
//       : null;

//   return (
//     <div className="ai-with-report">
//       <div className="left-panel">
//         <div className="panel-header">
//           <button
//             className="goal-button"
//             onClick={() => setIsModalOpen(true)}
//             disabled={!me}
//             aria-label="내 목표 목록 보기"
//           >
//             {me ? "내 목표 목록 보기" : "사용자 정보 로딩 중..."}
//           </button>
//         </div>

//         <div className="panel-body">
//           {loading && (
//             <div style={{ padding: 20 }}>데이터를 불러오는 중입니다...</div>
//           )}
//           {error && (
//             <div style={{ padding: 20, color: "red" }}>오류: {error}</div>
//           )}

//           {!loading && !error && userProfile && userMetrics && planData && (
//             <div style={{ marginTop: 16 }}>
//               <UserInfoPage 
//                 userProfile={userProfile} 
//                 userMetrics={userMetrics}
//                 planData={{ ...selectedGoal, ...planData }} 
//                 summaryData={planData} 
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="right-panel">
//         <div className="panel-header"></div>
//         <div className="panel-body chat-body">
//           <AIChatPage selectedReport={combinedDataForChat} />
//         </div>
//       </div>

//       <GoalSelectModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSelectGoal={handleSelectGoal}
//         me={me}
//       />
//     </div>
//   );
// }


// AIWithReportPage.js

// AIWithReportPage.js
// AIWithReportPage.js

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
import AIChatPage from "../components/AIChatPage";
import GoalSelectModal from "../components/GoalSelectModal";
import "./AIWithReportPage.css";
// ✅ 계산 함수를 부모 컴포넌트로 가져옵니다.
import { calculateBMI, calculateBMR } from "../../userinfoui/hooks/bmi.js";

export default function AIWithReportPage() {
  const { me } = useMe();

  const [userProfile, setUserProfile] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [planData, setPlanData] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (me && me.userId) {
      const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
          const profilePromise = axios.get("http://localhost:8080/profile", { withCredentials: true });
          const metricsPromise = axios.get(`http://localhost:8080/calc/${me.userId}/latest`, { withCredentials: true });
          const [profileResponse, metricsResponse] = await Promise.all([ profilePromise, metricsPromise ]);
          setUserProfile(profileResponse.data);
          setUserMetrics(metricsResponse.data);
        } catch (err) {
          console.error("초기 사용자 정보 로딩 실패:", err);
          setError("사용자 정보를 불러오는 데 실패했습니다.");
        }
        setLoading(false);
      };
      fetchInitialData();
    }
  }, [me]);

  const handleSelectGoal = async (goal) => {
    setLoading(true);
    setError(null);
    setSelectedGoal(goal);
    setPlanData(null);
    try {
      const res = await axios.get(`http://localhost:8080/api/plan/${goal.id}/summary`, { withCredentials: true });
      setPlanData(res.data);
    } catch (err) {
      console.error("플랜 데이터 불러오기 실패:", err);
      setError("목표 계획을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UI와 AI가 사용할 통합 데이터를 여기서 최종적으로 생성합니다.
  const reportDataForUIandAI = useMemo(() => {
    // 필요한 모든 데이터가 준비되기 전에는 null을 반환합니다.
    if (!userProfile || !userMetrics || !planData || !selectedGoal || !me) {
      return null;
    }

    // 목표의 시작 체중을 기준으로 BMI, BMR을 "여기서" 직접 계산합니다.
    const currentWeight = selectedGoal.startWeightKg;
    const calculatedBmi = calculateBMI(currentWeight, userProfile.height);
    const calculatedBmr = calculateBMR(
      currentWeight, userProfile.height, userProfile.age, userProfile.gender
    );

    // 사용자님의 '원래 코드'가 필요로 하던 모든 데이터를 정확한 출처에서 가져와 합칩니다.
    return {
      // --- userProfile ---
      gender: userProfile.gender,
      age: userProfile.age,
      height: userProfile.height,
      activityLevel: userProfile.activityLevel,
      profileImageUrl: userProfile.profileImageUrl,
      profileImageUpdatedAt: userProfile.updateAt,

      // --- me ---
      nickname: me.nickname,

      // --- 프론트엔드 계산 ---
      bmi: calculatedBmi,
      basalMetabolism: calculatedBmr,

      // --- userMetrics API ---
      // dailyCalories: userMetrics.dailyCalories, // TDEE
      dailyCalories: planData.tdee, // TDEE


      // --- selectedGoal (기본 목표 정보) ---
      startWeightKg: selectedGoal.startWeightKg,
      targetWeightKg: selectedGoal.targetWeightKg,
      endDate: selectedGoal.endDate,
      startDate: selectedGoal.startDate,
      weeks: selectedGoal.weeks,

      // --- planData API (/summary 응답) ---
      targetDailyCalories: planData.targetDailyCalories,
    };
  }, [userProfile, userMetrics, selectedGoal, planData, me]);

  return (
    <div className="ai-with-report">
      <div className="left-panel">
        <div className="panel-header">
          <button className="goal-button" onClick={() => setIsModalOpen(true)} disabled={!me}>
            {me ? "내 목표 목록 보기" : "사용자 정보 로딩 중..."}
          </button>
        </div>
        <div className="panel-body">
          {loading && !reportDataForUIandAI && <div style={{ padding: 20 }}>데이터를 불러오는 중입니다...</div>}
          {error && <div style={{ padding: 20, color: "red" }}>오류: {error}</div>}
          {reportDataForUIandAI && (
            <div style={{ marginTop: 16 }}>
              {/* ✅ UserInfoPage에는 완성된 데이터 객체 하나만 전달합니다. */}
              <UserInfoPage reportData={reportDataForUIandAI} />
            </div>
          )}
        </div>
      </div>
      <div className="right-panel">
        <div className="panel-header"></div>
        <div className="panel-body chat-body">
          {/* ✅ AIChatPage에도 똑같은 완성된 데이터를 전달합니다. */}
          <AIChatPage selectedReport={reportDataForUIandAI} />
        </div>
      </div>
      <GoalSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGoal={handleSelectGoal}
        me={me}
      />
    </div>
  );
}