import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

/** 헤더 높이만큼 padding-top을 주는 레이아웃 (기본 72px)
 *  팀 헤더를 건드리지 않고, 게시판 화면에서만 적용됨.
 *  header 태그가 있으면 실측해서 자동 보정, 없으면 기본값 사용.
 */
export default function PostsLayout({ fallback = 72 }) {
  const [pad, setPad] = useState(fallback);

  useEffect(() => {
    // 팀 헤더가 <header> 태그로 렌더되면 실제 높이를 가져와 반영
    const h = document.querySelector("header");
    if (h) {
      const rect = h.getBoundingClientRect();
      // 숫자(px)로 저장하면 React가 px 단위로 렌더함
      if (rect.height && Number.isFinite(rect.height)) setPad(Math.ceil(rect.height));
    }
  }, []);

  return (
    <div style={{ paddingTop: pad, boxSizing: "border-box" }}>
      <Outlet />
    </div>
  );
}
