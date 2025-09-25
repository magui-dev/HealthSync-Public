import React from "react";

export default function CloseButton({ onClick, ariaLabel = "닫기" }) {
  return (
    <button className="closeButton" onClick={onClick} aria-label={ariaLabel}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="6" y1="6" x2="18" y2="18" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
        <line x1="18" y1="6" x2="6" y2="18" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </button>
  );
}