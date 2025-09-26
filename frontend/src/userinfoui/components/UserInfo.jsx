import React from 'react';
import styles from './UserInfo.module.css';

// InfoItem 컴포넌트는 원래 주셨던 코드 그대로 사용합니다.
const InfoItem = ({ label, value, unit }) => (
  <div className={styles.infoCard}>
    <span className={styles.label}>{label}</span>
    <div className={styles.valueContainer}>
      <strong className={styles.value}>{value}</strong>
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  </div>
);

// 메인 컴포넌트
export default function UserInfo({ user }) {
  // 💡 [핵심] user 객체에서 받은 bmi, basalMetabolism 값의 유효성을 확인합니다.
  // toFixed나 Math.round는 숫자일 때만 호출해야 에러가 나지 않습니다.
  const bmiValue = typeof user.bmi === 'number' ? user.bmi.toFixed(1) : '(계산 필요)';
  const bmrValue = typeof user.basalMetabolism === 'number' ? Math.round(user.basalMetabolism) : '(계산 필요)';
  
 return (
    <div className={styles.infoGrid}>
      <InfoItem label="키" value={user.height} unit="cm" />
      <InfoItem label="성별/나이" value={`${user.gender} (${user.age}세)`} />
      <InfoItem label="BMI" value={bmiValue} />
      <InfoItem label="기초대사량" value={bmrValue} unit="kcal" />
      <InfoItem label="목표 기간" value={`${user.duration.weeks}주`} unit={`(${user.startDate} ~ ${user.endDate || ''})`} />
      <div className={styles.infoCard}>
        <span className={styles.label}>체중 변화</span>
        <div className={styles.valueContainer}>
          <strong className={styles.value}>{user.startWeightKg}</strong>
          <span className={styles.unit}>kg</span>
          <span className={styles.arrow}>→</span>
          <strong className={styles.value}>{user.targetWeightKg}</strong>
          <span className={styles.unit}>kg</span>
        </div>
      </div>
    </div>
  );
}