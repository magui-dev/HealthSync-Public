import React from 'react';
import { BMI_BUCKETS_KR } from '../lib/bmi';

// bmi 값에 해당하는 구간(bucket) 정보를 찾아주는 함수
const findBmiBucket = (bmi) => {
  return BMI_BUCKETS_KR.find(bucket => bmi >= bucket.min && bmi < bucket.max);
};

// ====================================================================
// ▼▼▼ 바로 이 함수가 빠져있던 핵심 로직입니다 ▼▼▼
// BMI 라벨과 성별에 맞는 이미지 경로를 최종적으로 결정하는 함수
const getBmiImageSrc = (label, gender) => {
  let imageNumber;

  // 1. BMI 라벨에 따라 1~5번 숫자를 결정합니다.
  switch (label) {
    case '저체중':
      imageNumber = 1;
      break;
    case '정상':
      imageNumber = 2;
      break;
    case '비만전단계':
      imageNumber = 3;
      break;
    case '1단계 비만':
      imageNumber = 4;
      break;
    case '2단계 비만':
      imageNumber = 5;
      break;
    case '3단계 비만': // 2단계와 3단계는 모두 5번 이미지를 사용합니다.
      imageNumber = 6;
      break;
    default:
      imageNumber = 2; // 혹시 모를 경우를 대비한 기본값 (정상)
  }

  // 2. 성별에 따라 'man' 또는 'woman' 접두사를 결정합니다.
  // gender prop이 'female'일 경우 'woman', 그 외에는 'man'을 사용합니다.
  const genderPrefix = gender === 'female' ? 'woman' : 'man';

  // 3. 접두사와 숫자를 조합하여 최종 이미지 경로를 반환합니다. (예: /images/man3.png)
  return `/images/${genderPrefix}${imageNumber}.png`;
};
// ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲
// ====================================================================


// 컴포넌트는 bmiValue와 gender를 props로 받습니다.
const BmiDisplay = ({ bmiValue, gender }) => {
  const bmiBucket = findBmiBucket(bmiValue);

  if (!bmiBucket) {
    return (
      <div className="bmi-container">
        <div className="bmi-label" style={{ backgroundColor: '#a0a0a0', color: 'white' }}>
          <span>-</span>
          <strong>측정값 없음</strong>
        </div>
      </div>
    );
  }

  // 위에서 만든 함수를 호출하여 성별과 BMI에 맞는 정확한 이미지 경로를 가져옵니다.
  const imageSrc = getBmiImageSrc(bmiBucket.label, gender);

  return (
    <div className="bmi-container">
      <img src={imageSrc} alt={bmiBucket.label} className="bmi-image" />
      <div className="bmi-label" style={{ backgroundColor: bmiBucket.color }}>
        <span>{bmiBucket.range}</span>
        <strong>{bmiBucket.label}</strong>
      </div>
    </div>
  );
};

export default BmiDisplay;