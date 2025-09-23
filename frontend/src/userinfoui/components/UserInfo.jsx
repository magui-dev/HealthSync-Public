import React from 'react';
import styles from './UserInfo.module.css'; // CSS 모듈 파일을 사용합니다.

// 각 정보 항목을 표시하는 자식 컴포넌트
const InfoItem = ({ label, value, unit }) => (
  <div className={styles.infoCard}>
    <span className={styles.label}>{label}</span>
    <div className={styles.valueContainer}>
      <strong className={styles.value}>{value}</strong>
      {/* unit이 있을 경우에만 단위를 표시합니다. */}
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  </div>
);

// 메인 컴포넌트
export default function UserInfo({ user }) {
  return (
    <div className={styles.infoGrid}>
      <InfoItem label="키" value={user.height} unit="cm" />
      <InfoItem label="체중" value={user.weight} unit="kg" />
      <InfoItem label="성별/나이" value={`${user.gender} (${user.age}세)`} />
      <InfoItem label="BMI" value={user.bmi.toFixed(1)} />
      <InfoItem 
        label="기초대사량" 
        value={Math.round(user.basalMetabolism)} 
        unit="kcal" 
      />
    </div>
  );
}