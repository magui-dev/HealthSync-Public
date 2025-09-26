// AIWithReportPage.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
import AIChatPage from "../components/AIChatPage";
import GoalSelectModal from "../components/GoalSelectModal";
import "./AIWithReportPage.css";

export default function AIWithReportPage() {
  const { me } = useMe();

  const [userProfile, setUserProfile] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);

  // 💡 [핵심] 2개의 목표 데이터를 별도로 관리합니다.
  const [selectedGoal, setSelectedGoal] = useState(null); // Modal에서 선택된 기본 목표 정보
  const [planData, setPlanData] = useState(null); // /summary API로 받은 상세 분석 정보

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (me && me.userId) {
      const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
          const profilePromise = axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
          const metricsPromise = axios.get(
            `http://localhost:8080/calc/${me.userId}/latest`,
            { withCredentials: true }
          );
          const [profileResponse, metricsResponse] = await Promise.all([
            profilePromise,
            metricsPromise,
          ]);
          setUserProfile(profileResponse.data);
          setUserMetrics(metricsResponse.data);
        } catch (err) {
          console.error("초기 사용자 정보 로딩 실패:", err);
          setError("사용자 정보를 불러오는 데 실패했습니다.");
        }
        // 💡 초기 로딩 완료 시점을 명확히 하기 위해 finally 제거
        setLoading(false);
      };
      fetchInitialData();
    }
  }, [me]);

  const handleSelectGoal = async (goal) => {
    setLoading(true);
    setError(null);
    setSelectedGoal(goal); // ◀ GoalSelectModal에서 받은 goal 객체 저장 (startWeightKg 여기 있음!)
    setPlanData(null);

    try {
      const res = await axios.get(`http://localhost:8080/api/plan/${goal.id}/summary`, {
        withCredentials: true,
      });
      setPlanData(res.data); // ◀ 상세 분석 데이터 저장
    } catch (err) {
      console.error("플랜 데이터 불러오기 실패:", err);
      setError("목표 계획을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const combinedDataForChat =
    userProfile && planData
      ? {
          ...userProfile,
          ...userMetrics,
          ...planData,
          nickname: me?.nickname,
        }
      : null;

  return (
    <div className="ai-with-report">
      <div className="left-panel">
        <div className="panel-header">
          <button
            className="goal-button"
            onClick={() => setIsModalOpen(true)}
            disabled={!me}
            aria-label="내 목표 목록 보기"
          >
            {me ? "내 목표 목록 보기" : "사용자 정보 로딩 중..."}
          </button>
        </div>

        <div className="panel-body">
          {loading && (
            <div style={{ padding: 20 }}>데이터를 불러오는 중입니다...</div>
          )}
          {error && (
            <div style={{ padding: 20, color: "red" }}>오류: {error}</div>
          )}

          {!loading && !error && userProfile && userMetrics && planData && (
            <div style={{ marginTop: 16 }}>
              <UserInfoPage 
                userProfile={userProfile} 
                userMetrics={userMetrics}
                planData={{ ...selectedGoal, ...planData }} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="right-panel">
        <div className="panel-header"></div>
        <div className="panel-body chat-body">
          <AIChatPage selectedReport={combinedDataForChat} />
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
