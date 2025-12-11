import { Outlet } from "react-router-dom";

export default function PostsLayout() {
  const layoutStyle = {
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
  };

  const contentStyle = {
    width: "100%",
    maxWidth: "950px",
  };

  return (
    <div style={layoutStyle}>
      {/* 가운데 콘텐츠 (게시판이 여기에 표시됩니다) */}
      <div style={contentStyle}>
        <Outlet />
      </div>
    </div>
  );
}
