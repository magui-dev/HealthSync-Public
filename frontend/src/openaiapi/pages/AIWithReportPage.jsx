import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
import AIChatPage from "../components/AIChatPage";
import GoalSelectModal from "../components/GoalSelectModal"; // 새로 만든 모달 import
import "./AIWithReportPage.css";
// import "./GoalLoader.css"; // 이 CSS는 이제 모달 CSS에 통합됨

export default function AIWithReportPage() {
  const { me } = useMe();
  const [userProfile, setUserProfile] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리

  useEffect(() => {
    if (me) {
      const fetchUserProfile = async () => {
        try {
          const res = await axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
          setUserProfile(res.data);
        } catch (err) {
          console.error("프로필 불러오기 실패", err);
        }
      };
      fetchUserProfile();
    }
  }, [me]);

  // 목표가 선택되었을 때 실행될 함수
  const handleSelectGoal = (goal) => {
    if (!userProfile) {
      alert("사용자 프로필 정보를 먼저 불러와야 합니다.");
      return;
    }

    const combinedData = {
      ...userProfile,
      ...goal,
      nickname: me.nickname,
      weight: goal.startWeightKg,
      targetPeriod: `${goal.weeks}주 (${goal.startDate} ~ ${goal.endDate})`,

      // ✅ 다른 컴포넌트와의 호환성을 위해 duration 객체를 다시 만들어주는 부분
      duration: { weeks: goal.weeks },
    };

    setSelectedReport(combinedData);
  };

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
          {selectedReport && (
            <div style={{ marginTop: 16 }}>
              <UserInfoPage report={selectedReport} />
            </div>
          )}
        </div>
      </div>

      <div className="right-panel">
        <div className="panel-header" aria-hidden="true" />
        <div className="panel-body chat-body">
          <AIChatPage selectedReport={selectedReport} />
        </div>
      </div>

      {/* 모달 컴포넌트 렌더링 */}
      <GoalSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGoal={handleSelectGoal}
        me={me}
      />
    </div>
  );
}
