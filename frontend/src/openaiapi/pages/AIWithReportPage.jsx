// AIWithReportPage.js

import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../api/axios";
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
          const profilePromise = api.get("/profile");
          const metricsPromise = api.get(`/calc/${me.userId}/latest`);
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
      const res = await api.get(`/api/plan/${goal.id}/summary`);
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

       // 목표 타입(normalize): API 응답의 다양한 키를 고려하고, 없으면 체중 증감으로 추론
   const rawType =
     selectedGoal.type ??
     planData.type ??
     planData.goalType ??
     null;
   const normalizedType = rawType
     ? String(rawType).toUpperCase()
     : (selectedGoal.targetWeightKg < selectedGoal.startWeightKg ? "LEAN" : "HEALTH");


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
      type: normalizedType,

      // --- planData API (/summary 응답) ---
      targetDailyCalories: planData.targetDailyCalories,
    };
  }, [userProfile, userMetrics, selectedGoal, planData, me]);

  return (
    <div className="ai-with-report">
      <div className="left-panel">
        {!reportDataForUIandAI && (
          <button className="goal-button" onClick={() => setIsModalOpen(true)} disabled={!me}>
            {me ? "내 목표 목록 보기" : "사용자 정보 로딩 중..."}
          </button>
        )}
        <div className="panel-header">
        </div>
        <div className="panel-body">
          {loading && !reportDataForUIandAI && <div style={{ padding: 20 }}>데이터를 불러오는 중입니다...</div>}
          {error && <div style={{ padding: 20, color: "red" }}>오류: {error}</div>}
          {reportDataForUIandAI && (
            <div>
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