import React from 'react';

const ReportHeader = ({ period, weights }) => {
  return (
    <div className="report-section">
      <div className="info-box">
        <p>목표 기간 : {period.start} ~ {period.end}</p>
      </div>
      <div className="info-box">
        <p>시작 체중 / 목표 체중 : {weights.start} kg / {weights.target} kg</p>
      </div>
    </div>
  );
};

export default ReportHeader;