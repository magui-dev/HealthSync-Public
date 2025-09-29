import React, { useState, useEffect } from 'react';

const ProgressBar = ({ startDate, endDate }) => {
  const [progress, setProgress] = useState(0);
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
const current = new Date(); // 항상 현재 날짜를 사용

    const totalDuration = end.getTime() - start.getTime();
    const elapsedTime = current.getTime() - start.getTime();

    let calculatedProgress = (elapsedTime / totalDuration) * 100;
    setProgress(Math.max(0, Math.min(100, calculatedProgress)));
    setCurrentDateString(`${current.getMonth() + 1}월 ${current.getDate()}일`);
  }, [startDate, endDate]);

  const iconLeftPosition = `calc(${progress}% - 15px)`; 

  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <span>start</span>
        
        <div className="arrow-svg-container">
          <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#ffdd57' }} />
                <stop offset="100%" style={{ stopColor: '#76c7c0' }} />
              </linearGradient>
            </defs>
            {/* ▼▼▼ 이 path 경로가 진짜 화살표 모양을 만듭니다 ▼▼▼ */}
            <path 
              d="M 0 5 L 190 5 L 190 0 L 200 10 L 190 20 L 190 15 L 0 15 Z" 
              fill="url(#arrowGradient)" 
            />
          </svg>

          <div className="runner-icon" style={{ left: iconLeftPosition }}>
             <img 
              src="/icons/run.png" 
              className="runner-image" 
            />
            <div className="current-date-label">{currentDateString}</div>
          </div>
        </div>

        <span>finish</span>
      </div>
    </div>
  );
};

export default ProgressBar;