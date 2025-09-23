import { Outlet } from "react-router-dom";
// import { useEffect, useState } from "react";
import healthImage from '../../../assets/health.png';
import leanImage from '../../../assets/lean.png';

export default function PostsLayout() {
  const layoutStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 920px 1fr",
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "grayscale(100%) brightness(0.6)",
  };

  return (
    <div style={layoutStyle}>
      {/* 왼쪽 이미지 */}
      <div style={{ ...imageStyle, backgroundImage: `url(${healthImage})` }} />
      
      {/* 가운데 콘텐츠 (게시판이 여기에 표시됩니다) */}
      <div>
        <Outlet />
      </div>

      {/* 오른쪽 이미지 */}
      <div style={{ ...imageStyle, backgroundImage: `url(${leanImage})` }} />
    </div>
  );
}