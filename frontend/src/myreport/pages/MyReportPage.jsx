import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMe } from '../../hooks/useMe'; 

import GoalList from '../components/GoalList';
import ReportHeader from '../components/ReportHeader';
import ProgressBar from '../components/ProgressBar';
import BmiDisplay from '../components/BmiDisplay';
import CalorieReport from '../components/CalorieReport';
import '../myreport.css';

const MyReportPage = () => {
  const { me, loading: meLoading } = useMe();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meLoading && me) {
      const fetchReportData = async () => {
        try {
          // 1. 실제로 존재하는 /profile API만 호출합니다.
          const profileRes = await axios.get("http://localhost:8080/profile", { withCredentials: true });
          const profile = profileRes.data;

          // 2. 아직 백엔드에 없는 리포트 상세 정보는 임시 데이터(mock)로 만듭니다.
          //    나중에 실제 API가 생기면 이 부분을 API 호출로 바꾸면 됩니다.
          const mockReportDetails = {
            goals: [
              { id: 1, text: '지난 목표 ∙ 이미 종료된 목표', isCurrent: false },
              { id: 2, text: '지난 목표 ∙ 이미 종료된 목표', isCurrent: false },
              { id: 3, text: '현재 진행 중인 목표', isCurrent: true },
            ],
            startDate: '2025.08.30',
            endDate: '2025.09.26',
            targetWeight: 88,
            dailyCalories: 1580,
            mealCalories: 526,
            mealPlan: {
              carbs: { name: '쌀밥', amount: '120g', kcal: 156 },
              protein: { name: '닭가슴살', amount: '160g', kcal: 264 },
              fat: { name: '올리브오일', amount: '2 tsp (10ml)', kcal: 80 },
              vegetables: { name: '야채', amount: '100g', kcal: 25 },
              totalKcal: 525,
            },
          };
          
          // 3. 실제 데이터(profile)와 임시 데이터(mock)를 합쳐서 최종 데이터를 만듭니다.
          const combinedData = {
            goals: mockReportDetails.goals,
            goalPeriod: { start: mockReportDetails.startDate, end: mockReportDetails.endDate },
            weights: { start: profile.weight, target: mockReportDetails.targetWeight },
            user: { height: profile.height, gender: profile.gender?.toUpperCase() },
            dailyCalories: mockReportDetails.dailyCalories,
            mealCalories: mockReportDetails.mealCalories,
            mealPlan: mockReportDetails.mealPlan,
          };
          
          setReportData(combinedData);

        } catch (error) {
          console.error("프로필 데이터를 불러오는 데 실패했습니다.", error);
        } finally {
          setLoading(false);
        }
      };

      fetchReportData();
    } else if (!meLoading && !me) {
      setLoading(false);
    }
  }, [me, meLoading]);

  // --- 렌더링 로직 (이전과 동일) ---

  if (loading) {
    return <div className="report-loading">리포트 데이터를 불러오는 중입니다...</div>;
  }

  if (!reportData) {
    return <div className="report-error">리포트 데이터가 없거나 불러올 수 없습니다.</div>;
  }

  const heightInMeters = reportData.user.height / 100;
  const bmiValue = (reportData.weights.start / (heightInMeters * heightInMeters)).toFixed(1);

  return (
    <div className="my-report-container">
      <GoalList goals={reportData.goals} />
      <main className="report-content">
        <ReportHeader period={reportData.goalPeriod} weights={reportData.weights} />
        <div className="report-section progress-bmi-section">
          <ProgressBar startDate={reportData.goalPeriod.start} endDate={reportData.goalPeriod.end} />
          <BmiDisplay 
            bmiValue={bmiValue} 
            gender={reportData.user.gender === 'FEMALE' ? 'female' : 'man'}
          />
        </div>
        <CalorieReport
          dailyCalories={reportData.dailyCalories}
          mealCalories={reportData.mealCalories}
          mealPlan={reportData.mealPlan}
        />
      </main>
    </div>
  );
};

export default MyReportPage;