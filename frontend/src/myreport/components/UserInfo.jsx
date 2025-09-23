import React from 'react';
import styles from '../pages/MyReportPage.module.css';

const InfoItem = ({ label, value }) => (
  <div className={styles.infoItem}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function UserInfo({ user }) {
  return (
    <div className={styles.infoGrid}>
      {/* 👇 여기서 'cm'와 'kg'를 제거하고 받은 값(user.height)을 그대로 사용합니다. */}
      <InfoItem label="키" value={user.height} />
      <InfoItem label="체중" value={user.weight} />
      <InfoItem label="성별" value={`${user.gender} (${user.age}세)`} />
      <InfoItem label="BMI" value={user.bmi} />
      <InfoItem label="기초대사량" value={`${Math.round(user.basalMetabolism)} kcal`} />
    </div>
  );
}