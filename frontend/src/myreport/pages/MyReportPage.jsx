import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import { calculateBMI } from "../lib/bmi";
import GoalSelectModal from "../../openaiapi/components/GoalSelectModal";

import ReportHeader from "../components/ReportHeader";
import ProgressBar from "../components/ProgressBar";
import BmiDisplay from "../components/BmiDisplay";
import CalorieReport from "../components/CalorieReport";
import "../myreport.css";

const MyReportPage = () => {
  const { me, loading: meLoading } = useMe();
  const [userProfile, setUserProfile] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null); // ID 대신 객체 전체를 저장
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false); // 로딩 상태 통합
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✨ useEffect 1: 페이지 진입 시 사용자 프로필 정보를 미리 가져옴
  useEffect(() => {
    if (me && !userProfile) {
      const fetchProfile = async () => {
        try {
          const res = await axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
          setUserProfile(res.data);
        } catch (err) {
          console.error("프로필 정보를 불러오는 데 실패했습니다.", err);
          setError("프로필 정보를 불러올 수 없습니다.");
        }
      };
      fetchProfile();
    }
  }, [me, userProfile]);

  // ✨ useEffect 2: selectedGoal이 바뀔 때마다 상세 데이터를 가져와 최종 reportData를 조합 (핵심 로직)
  useEffect(() => {
    // 계산에 필요한 userProfile과 selectedGoal 데이터가 준비되기 전에는 실행하지 않음
    if (!selectedGoal || !userProfile) {
      setReportData(null);
      return;
    }

    const fetchDetailsAndCombine = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 존재하는 API인 'summary' API를 호출
        const [summaryRes, foodSelectionsRes] = await Promise.all([
          axios.get(
            `http://localhost:8080/api/plan/${selectedGoal.id}/summary`,
            { withCredentials: true }
          ),
          // ✅ goalId를 쿼리 파라미터로 전달합니다.
          axios.get(
            `http://localhost:8080/api/plan/food-selections?goalId=${selectedGoal.id}`,
            { withCredentials: true }
          ),
        ]);

        const summaryData = summaryRes.data;
        const foodSelectionsArray = foodSelectionsRes.data; // 배열 형태의 식단 데이터

        const mealPlanObject = foodSelectionsArray.reduce((acc, item) => {
          let key;
          // 백엔드 카테고리 이름에 따라 프론트엔드 키를 명시적으로 매핑합니다.
          switch (item.category) {
            case "CARB":
              key = "carbs"; // 'carb'가 아닌 'carbs'로
              break;
            case "PROTEIN":
              key = "protein"; // 'protein'은 그대로
              break;
            case "FAT":
              key = "fat"; // 'fat'은 그대로
              break;
            case "CUSTOM":
              key = "custom";
              break;
            default:
              // 혹시 모를 다른 카테고리는 무시
              return acc;
          }

          acc[key] = {
            name: item.label,
            amount: item.servingG ? `${item.servingG}g` : "", // servingG가 null일 경우 대비
            kcal: item.kcal,
          };
          return acc;
        }, {});

        mealPlanObject.totalKcal = Object.values(mealPlanObject).reduce(
          (sum, item) => sum + (item.kcal || 0),
          0
        );

        // 2. 프론트엔드에서 BMI 계산
        const bmiValue = calculateBMI(
          selectedGoal.startWeightKg,
          userProfile.height
        );

        // 3. 모든 데이터 소스를 조합하여 최종 reportData 생성
        const combinedData = {
          goalPeriod: {
            start: selectedGoal.startDate,
            end: selectedGoal.endDate,
          },
          weights: {
            start: selectedGoal.startWeightKg,
            target: selectedGoal.targetWeightKg,
          },
          user: {
            height: userProfile.height,
            gender: userProfile.gender?.toUpperCase(),
          },
          bmi: bmiValue,

          dailyCalories: summaryData.targetDailyCalories, // '일 섭취 권장 칼로리'
          mealCalories: summaryData.perMealKcal, // '1회 식사 권장 칼로리'

          // (임시 데이터) 백엔드 summary 응답에 mealPlan이 추가되면 이 부분을 교체
          mealPlan: mealPlanObject,
        };
        setReportData(combinedData);
      } catch (err) {
        console.error("리포트 상세 정보를 불러오는 데 실패했습니다.", err);
        setError("리포트 상세 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetailsAndCombine();
  }, [selectedGoal, userProfile]); // selectedGoal 또는 userProfile이 변경될 때 실행

  // ✅ [수정] 목표 선택 핸들러: goal 객체 전체를 저장
  const handleSelectGoal = (goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(false); // 선택 후 모달 닫기
  };

  // --- 렌더링 로직 ---
  const renderReportContent = () => {
    if (!selectedGoal) {
      return (
        <div className="report-placeholder">분석할 목표를 선택해주세요.</div>
      );
    }
    if (loading) {
      return (
        <div className="report-loading">
          리포트 데이터를 불러오는 중입니다...
        </div>
      );
    }
    if (error) {
      return <div className="report-error">{error}</div>;
    }
    if (!reportData) {
      return null;
    }

    // ✅ [수정] 이제 reportData에서 직접 bmi 값을 가져와 사용
    const bmiValue = reportData.bmi;

    return (
      <>
        <ReportHeader
          period={reportData.goalPeriod}
          weights={reportData.weights}
        />
        <div className="report-section progress-bmi-section">
          <ProgressBar
            startDate={reportData.goalPeriod.start}
            endDate={reportData.goalPeriod.end}
          />
          <BmiDisplay
            bmiValue={bmiValue?.toFixed(1)}
            gender={reportData.user.gender === "FEMALE" ? "female" : "man"}
          />
        </div>
        <CalorieReport
          dailyCalories={reportData.dailyCalories}
          mealCalories={reportData.mealCalories}
          mealPlan={reportData.mealPlan}
        />
      </>
    );
  };

  return (
    <div className="my-report-container">
      <aside className="report-sidebar">
        <div className="sidebar-header">
          <button
            className="select-goal-button"
            onClick={() => setIsModalOpen(true)}
            disabled={meLoading || !me}
          >
            {me ? "분석할 목표 선택" : "사용자 정보 로딩 중..."}
          </button>
        </div>
      </aside>
 <main className="report-content">
        <div className="main-content-header">
          <h4>내 목표 리포트</h4>
        </div>
        {renderReportContent()}
      </main>      <GoalSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGoal={handleSelectGoal}
        me={me}
      />
    </div>
  );
};

export default MyReportPage;
