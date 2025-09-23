import React from 'react';

const CalorieReport = ({ dailyCalories, mealCalories, mealPlan }) => {
  return (
    <div className="report-section">
      <div className="info-box">
        <p>일 섭취 필요칼로리 : {dailyCalories.toLocaleString()} kcal</p>
      </div>
      <div className="info-box">
        <p>식사량 별 섭취 칼로리(X회 기준) : {mealCalories.toLocaleString()} kcal</p>
      </div>
      <div className="info-box-detail">
        <ul>
          <li><strong>탄</strong>: {mealPlan.carbs.name} {mealPlan.carbs.amount} ({mealPlan.carbs.kcal} kcal)</li>
          <li><strong>단</strong>: {mealPlan.protein.name} {mealPlan.protein.amount} (≈{mealPlan.protein.kcal} kcal)</li>
          <li><strong>지</strong>: {mealPlan.fat.name} {mealPlan.fat.amount} (≈{mealPlan.fat.kcal} kcal)</li>
          <li><strong>야채</strong>: {mealPlan.vegetables.name} {mealPlan.vegetables.amount} (≈{mealPlan.vegetables.kcal} kcal)</li>
        </ul>
        <p className="total-kcal"><strong>합계 ≈ {mealPlan.totalKcal} kcal</strong></p>
      </div>
    </div>
  );
};

export default CalorieReport;