// packages/community/posts/PostsPathAliasGuard.jsx
import { useEffect } from "react";

export default function PostsPathAliasGuard() {
  useEffect(() => {
    const alias = () => {
      const { pathname } = window.location;
      const m = pathname.match(/^\/posts\/(\d+)(?:\/(edit))?\/?$/);
      if (!m) return;
      const id = m[1];
      const isEdit = m[2] === "edit";
      const to = isEdit ? `/community/posts/${id}/edit` : `/community/posts/${id}`;
      if (to !== pathname) {
        window.history.replaceState({}, "", to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };

    // 초기 진입 및 앞으로/뒤로 가기
    alias();
    window.addEventListener("popstate", alias);

    // a[href="/posts/..."] 클릭 가로채기
    const onClick = (e) => {
      const a = e.target.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.origin);
      const m = url.pathname.match(/^\/posts\/(\d+)(?:\/(edit))?\/?$/);
      if (!m) return;

      e.preventDefault();
      const id = m[1];
      const isEdit = m[2] === "edit";
      const to = isEdit ? `/community/posts/${id}/edit` : `/community/posts/${id}`;
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };

    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", alias);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
