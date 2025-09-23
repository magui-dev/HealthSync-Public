import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPosts, myBookmarks, myLikes } from "../api";
import { useMe } from "../../../hooks/useMe";
import styles from "./PostList.module.css"; // CSS 모듈 파일을 불러옵니다.

export default function PostList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({
    content: [],
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("createdAt,desc");
  const [filter, setFilter] = useState("all");
  const { me } = useMe();

  const page = parseInt(params.get("page") || "0", 10);
  const size = 10;

  // 데이터 로딩 로직 (useEffect)은 이전과 동일합니다.
  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setErr("");

    let apiCall;
    if (filter === "bookmarks") {
      apiCall = myBookmarks({ page, size });
    } else if (filter === "likes") {
      apiCall = myLikes({ page, size });
    } else {
      apiCall = listPosts({ page, size, sort });
    }

    apiCall
      .then((res) => {
        // ... (이 부분은 이전과 동일)
        const pageData = res?.data ?? res;

        if (filter === "likes") {
          setData({
            content: pageData?.content ?? [],
            totalPages: pageData?.totalPages ?? 1,
            totalElements: pageData?.totalElements ?? 0,
          });
          return;
        }

        if (filter === "bookmarks") {
          const totalPages = pageData?.totalPages ?? 1;
          const totalElements = pageData?.totalElements ?? 0;
          const rows = (pageData?.content ?? [])
            .map((item) => {
              const post = item?.post ?? item;
              const id = post?.id ?? post?.postId;
              if (id == null) return null;
              return {
                ...post,
                id,
                title: post?.title ?? post?.postTitle ?? "(제목 없음)",
                createdAt: post?.createdAt ?? item?.createdAt ?? null,
                authorNickname:
                  post?.authorNickname ??
                  post?.author?.nickname ??
                  "북마크된 글",
              };
            })
            .filter(Boolean);

          setData({ content: rows, totalPages, totalElements });
          return;
        }

        setData({
          content: pageData?.content ?? [],
          totalPages: pageData?.totalPages ?? 1,
          totalElements: pageData?.totalElements ?? 0,
        });
      })
      .catch((e) => setErr(e?.message || "불러오기에 실패했습니다"))
      .finally(() => setLoading(false));
  }, [page, sort, filter]);

  const go = (p) => setParams({ page: String(p) });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>HealthSync 커뮤니티</h1>
        <div className={styles.actions}>
          <Link to="myposts" className={styles.secondaryButton}>
            내 활동
          </Link>
          <Link to="new" className={styles.newPostButton}>
            글쓰기
          </Link>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <button
            onClick={() => {
              setFilter("all");
              go(0);
            }}
            className={`${styles.filterButton} ${
              filter === "all" ? styles.active : ""
            }`}
          >
            전체글
          </button>
          {me && (
            <>
              <button
                onClick={() => {
                  setFilter("likes");
                  go(0);
                }}
                className={`${styles.filterButton} ${
                  filter === "likes" ? styles.active : ""
                }`}
              >
                좋아요
              </button>
              <button
                onClick={() => {
                  setFilter("bookmarks");
                  go(0);
                }}
                className={`${styles.filterButton} ${
                  filter === "bookmarks" ? styles.active : ""
                }`}
              >
                북마크
              </button>
            </>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="createdAt,desc">최신순</option>
          <option value="createdAt,asc">오래된순</option>
        </select>
      </div>

      {loading && <div>로딩 중...</div>}
      {!!err && <div className={styles.error}>{err}</div>}
      {!loading && !err && data.content.length === 0 && (
        <div className={styles.empty}>게시글이 없습니다.</div>
      )}

      <div>
        {!loading &&
          !err &&
          data.content.map((p) => (
            <div key={p.id} className={styles.postItem}>
              <Link
                to={`/community/posts/${p.id}`}
                state={{ from: "list" }}
                className={styles.postLink}
              >
                {p.title}
              </Link>
              <div className={styles.postMeta}>
                {p.authorNickname ?? "익명"} ·{" "}
                {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
      </div>

      {!loading && data.totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => go(page - 1)}>
            이전
          </button>
          <span>
            {page + 1} / {data.totalPages}
          </span>
          <button
            disabled={page + 1 >= data.totalPages}
            onClick={() => go(page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
