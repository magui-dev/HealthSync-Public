import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMe } from "../../hooks/useMe";
import { calculateBMI } from "../lib/bmi";
import GoalSelectModal from "../../openaiapi/components/GoalSelectModal";

import ReportHeader from "../components/ReportHeader";
import ProgressBar from "../components/ProgressBar";
import BmiDisplay from "../components/BmiDisplay";
import SavedMealsStrip from "../../pages/PlanReport/SavedMealsStrip";

import "../myreport.css";

const PRESETS = {
  carb: [
    {
      key: "brown-rice",
      name: "현미밥",
      icon: "brown-rice",
      kcalPer100g: 172,
      macrosPer100g: { carb_g: 38.9, protein_g: 3.1, fat_g: 0.47 },
    },
    {
      key: "sweet-potato",
      name: "고구마",
      icon: "sweet-potato",
      kcalPer100g: 86,
      macrosPer100g: { carb_g: 20.1, protein_g: 1.6, fat_g: 0.1 },
    },
    {
      key: "oatmeal",
      name: "오트밀",
      icon: "oatmeal",
      kcalPer100g: 389,
      macrosPer100g: { carb_g: 66, protein_g: 17, fat_g: 7 },
    },
  ],
  protein: [
    {
      key: "chicken-breast",
      name: "닭가슴살",
      icon: "chicken-breast",
      kcalPer100g: 165,
      macrosPer100g: { carb_g: 0, protein_g: 31, fat_g: 3.6 },
    },
    {
      key: "tofu",
      name: "두부",
      icon: "tofu",
      kcalPer100g: 76,
      macrosPer100g: { carb_g: 1.9, protein_g: 8, fat_g: 4.8 },
    },
    {
      key: "eggs",
      name: "계란",
      icon: "eggs",
      kcalPer100g: 143,
      macrosPer100g: { carb_g: 1.1, protein_g: 13, fat_g: 10 },
    },
  ],
  fat: [
    {
      key: "olive-oil",
      name: "올리브유",
      icon: "olive-oil",
      kcalPer100g: 884,
      macrosPer100g: { carb_g: 0, protein_g: 0, fat_g: 100 },
    },
    {
      key: "avocado",
      name: "아보카도",
      icon: "avocado",
      kcalPer100g: 160,
      macrosPer100g: { carb_g: 9, protein_g: 2, fat_g: 15 },
    },
    {
      key: "almond",
      name: "아몬드",
      icon: "almond",
      kcalPer100g: 579,
      macrosPer100g: { carb_g: 22, protein_g: 21, fat_g: 50 },
    },
  ],
};

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
    if (!selectedGoal || !userProfile) {
      setReportData(null);
      return;
    }

    const fetchDetailsAndCombine = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, foodSelectionsRes] = await Promise.all([
          axios.get(
            `http://localhost:8080/api/plan/${selectedGoal.id}/summary`,
            { withCredentials: true }
          ),
          axios.get(
            `http://localhost:8080/api/plan/food-selections?goalId=${selectedGoal.id}`,
            { withCredentials: true }
          ),
        ]);

        const summaryData = summaryRes.data;
        const foodSelectionsArray = foodSelectionsRes.data; // 배열 형태의 식단 데이터

        const mealItemsForStrip = foodSelectionsArray.map((item) => {
          const macroKey = item.category.toLowerCase();
          const name = item.label.replace(/\s*\d+g$/, "").trim();
          let iconUrl = "/icons/custom.png";

          if (item.source === "PRESET") {
            const presetItem = PRESETS[macroKey]?.find((p) => p.name === name);
            if (presetItem) {
              iconUrl = `/icons/${presetItem.icon}.png`;
            }
          }

          return {
            id: item.id,
            macro: item.category,
            name: name,
            iconUrl: iconUrl,
            grams: item.servingG,
            carb: item.carbsG,
            protein: item.proteinG,
            fat: item.fatG,
            kcal: item.kcal,
          };
        });

        const savedMealForStrip = {
          id: `goal-report-${selectedGoal.id}`,
          createdAt: new Date().toISOString(),
          items: mealItemsForStrip,
        };

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
savedMeal: savedMealForStrip,
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
        {" "}
        <ReportHeader
          period={reportData.goalPeriod}
          weights={reportData.weights}
        />
        {" "}
        <div className="report-section progress-bmi-section">
          {" "}
          <ProgressBar
            startDate={reportData.goalPeriod.start}
            endDate={reportData.goalPeriod.end}
          />
         {" "}
          <BmiDisplay
            bmiValue={bmiValue?.toFixed(1)}
            gender={reportData.user.gender === "FEMALE" ? "female" : "man"}
          />
          {" "}
        </div>
        <div className="report-section">
          <div className="info-box">
            <p>
              일 섭취 필요칼로리 :{" "}
              {(reportData.dailyCalories ?? 0).toLocaleString()} kcal
            </p>
          </div>
          <div className="info-box">
            <p>
              1회 식사 권장량 :{" "}
              {(reportData.mealCalories ?? 0).toLocaleString()} kcal
            </p>
          </div>
           <div 
              className="report-meal-strip-container" // ✨ className 추가
              style={{ marginTop: '16px', background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:14, color:"#111827", boxShadow:"0 1px 2px rgba(0,0,0,0.03)" }}
            >
                <SavedMealsStrip
                saved={reportData.savedMeal}
                onApply={null}
                />
            </div>
        </div>
        {" "}
      </>
    );
  };

  return (
    <div style={{ padding: "14px" }}>
      <div className="my-report-container">
        <aside className="report-sidebar">
          <div className="sidebar-header">

            <div className="main-content-header">
            <h4>나의 리포트</h4>
          </div>
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
          
          {renderReportContent()}
        </main>{" "}
        <GoalSelectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectGoal={handleSelectGoal}
          me={me}
        />
      </div>
    </div>
  );
};

export default MyReportPage;
