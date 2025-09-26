// AIWithReportPage.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
import AIChatPage from "../components/AIChatPage";
// ✅ [수정] GoalSelectModal의 import 경로를 원래대로 되돌립니다.
import GoalSelectModal from "../components/GoalSelectModal";
import "./AIWithReportPage.css";

export default function AIWithReportPage() {
  const { me } = useMe();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
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
          const profilePromise = axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
          const metricsPromise = axios.get(`http://localhost:8080/calc/${me.userId}/latest`, {
            withCredentials: true,
          });

          const [profileResponse, metricsResponse] = await Promise.all([
            profilePromise,
            metricsPromise,
          ]);
          
          setUserProfile(profileResponse.data);
          setUserMetrics(metricsResponse.data);
        } catch (err) {
          console.error("초기 사용자 정보 로딩 실패:", err);
          setError("사용자 정보를 불러오는 데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [me]);

  const handleSelectGoal = async (goal) => {
    setLoading(true);
    setError(null);
    setPlanData(null);

    try {
      const res = await axios.get(`http://localhost:8080/api/plan/${goal.id}/summary`, {
        withCredentials: true,
      });
      setPlanData(res.data);
    } catch (err) {
      console.error("플랜 데이터 불러오기 실패:", err);
      setError("목표 계획을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };
  
  const combinedDataForChat = (userProfile && planData) ? {
      ...userProfile,
      ...userMetrics,
      ...planData,
      nickname: me?.nickname,
  } : null;

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
          {loading && <div style={{padding: 20}}>데이터를 불러오는 중입니다...</div>}
          {error && <div style={{padding: 20, color: 'red'}}>오류: {error}</div>}
          
          {!loading && !error && userProfile && userMetrics && planData && (
            <div style={{ marginTop: 16 }}>
              <UserInfoPage 
                userProfile={userProfile} 
                userMetrics={userMetrics}
                planData={planData} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="right-panel">
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