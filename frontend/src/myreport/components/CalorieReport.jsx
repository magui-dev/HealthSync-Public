import React from 'react';

const CalorieReport = ({ dailyCalories, mealCalories, mealPlan }) => {
  // 1. mealPlan 데이터가 아직 준비되지 않았을 경우를 위한 안전장치
  if (!mealPlan) {
    // 이 부분은 로딩 중 잠시 보이거나, 데이터가 없을 때 표시됩니다.
    return <div>식단 정보를 계산 중입니다...</div>;
  }

  return (
    <div className="report-section">
      <div className="info-box">
        {/* 2. 숫자 값들도 null일 수 있으므로 방어 코드를 추가합니다. */}
        <p>일 섭취 필요칼로리 : {(dailyCalories ?? 0).toLocaleString()} kcal</p>
      </div>
      <div className="info-box">
        <p>1회 식사 권장량 : {(mealCalories ?? 0).toLocaleString()} kcal</p>
      </div>
      <div className="info-box-detail">
        <ul>
          {/* 3. ✅ [핵심] 모든 데이터 접근에 Optional Chaining(?.)과 Nullish Coalescing(??)을 적용합니다. */}
          {mealPlan.carbs && (
            <li><strong>탄수화물</strong>: {mealPlan.carbs.name} (≈{(mealPlan.carbs.kcal ?? 0)} kcal)</li>
          )}
          {mealPlan.protein && (
            <li><strong>단백질</strong>: {mealPlan.protein.name} (≈{(mealPlan.protein.kcal ?? 0)} kcal)</li>
          )}
          {mealPlan.fat && (
            <li><strong>지방</strong>: {mealPlan.fat.name}(≈{(mealPlan.fat.kcal ?? 0)} kcal)</li>
          )}
          {/* 커스텀 식단이 있을 경우에만 이 부분을 화면에 표시합니다. */}
          {mealPlan.custom && (
            <li><strong>커스텀</strong>: {mealPlan.custom.name} (≈{(mealPlan.custom.kcal ?? 0)} kcal)</li>
          )}
        </ul>
        <p className="total-kcal"><strong>합계 ≈ {mealPlan.totalKcal ?? 0} kcal</strong></p>
      </div>
    </div>
  );
};

export default CalorieReport;