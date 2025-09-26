import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GoalSelectModal.css';

export default function GoalSelectModal({ isOpen, onClose, onSelectGoal, me }) {

  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    if (isOpen && me) {
      const fetchGoals = async () => {
        setIsLoading(true);
        try {
          const res = await axios.get('http://localhost:8080/api/plan/goals', {
            withCredentials: true,
          });
          setGoals(res.data);
        } catch (err) {
          console.error("목표 목록 불러오기 실패:", err);
          setGoals([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGoals();
    }
  }, [isOpen, me]);

  const handleGoalClick = (goal) => {
    onSelectGoal(goal.id); 
    onClose();
  };
  
  const handleCreateNew = () => {
    onClose();
    navigate('/plan'); // 목표 설정 페이지로 이동 (경로는 실제 프로젝트에 맞게 수정)
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>분석할 목표 선택</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <p>목표를 불러오는 중입니다...</p>
          ) : goals.length > 0 ? (
            <div className="goal-card-list">
              {/* ✅ 빠져있던 goals.map 부분을 아래와 같이 채웠습니다. */}
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="goal-card"
                  onClick={() => handleGoalClick(goal)}
                >
                  <div className="goal-card-header">
                    <span className={`goal-type-badge ${goal.type.toLowerCase()}`}>
                      {goal.type === "LEAN" ? "체중 감량" : "건강 관리"}
                    </span>
                    <span className="goal-period">{goal.weeks}주 목표</span>
                  </div>
                  <div className="goal-card-body">
                    <p className="goal-date">{goal.startDate} ~ {goal.endDate}</p>
                    <p className="goal-weight-info">
                      {goal.startWeightKg}kg → {goal.targetWeightKg}kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">🗂️</span>
              <h4>저장된 목표가 없어요</h4>
              <p>새로운 목표를 설정하고 AI 분석을 시작해보세요!</p>
              <button onClick={handleCreateNew} className="create-goal-button-alt">
                목표 설정하러 가기
              </button>
            </div>
          )}
        </div>
        
        {goals.length > 0 && (
            <div className="modal-footer">
                <button onClick={handleCreateNew} className="create-goal-button">
                    새 목표 만들기
                </button>
            </div>
        )}
      </div>
    </div>
  );
}