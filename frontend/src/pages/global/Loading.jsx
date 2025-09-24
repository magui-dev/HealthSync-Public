import React from "react";

export default function Loading() {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f9f9f9",
    gap: "16px",
  };

  const spinnerStyle = {
    width: "50px",
    height: "50px",
    border: "6px solid #ddd",
    borderTopColor: "#007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const textStyle = {
    fontSize: "1.2em",
    color: "#555",
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      <p style={textStyle}>로딩 중...</p>

      {/* keyframes 애니메이션 추가 */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
