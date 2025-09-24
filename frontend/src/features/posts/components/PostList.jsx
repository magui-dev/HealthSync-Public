// PostList.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPosts, myBookmarks, myLikes } from "../api";
import { useMe } from "../../../hooks/useMe";
import styles from "./PostList.module.css";

const DEFAULT_IMAGE_PATH = "/images/profile-images/default.png";

// API 절대경로 보정 유틸
const API_ORIGIN =
  (import.meta?.env && import.meta.env.VITE_API_ORIGIN) ||
  "http://localhost:8080";

function resolveImageUrl(u) {
  if (!u) return null;
  if (/^images\//i.test(u)) u = "/" + u;
  if (/^https?:\/\//i.test(u)) return u;               // 절대경로면 그대로
  if (u.startsWith("/images/")) return u;
 if (u.startsWith("/")) return API_ORIGIN + u;        // "/images/..." -> "http://localhost:8080/images/..."
  return `${API_ORIGIN}/${u}`;                          // "images/..."  -> "http://localhost:8080/images/..."
}

function withQuery(url, key, val) {
  if (!url) return url;
 const u = /^https?:\/\//i.test(url)
   ? new URL(url)                       // 절대경로면 그대로
   : new URL(url, window.location.origin); // ✅ 상대경로는 5173 기준
  u.searchParams.set(key, String(val));
  return u.toString();
}

// 백엔드에서 내려준 URL/updatedAt으로 <img src> 만들기 (추가 fetch 없음)
function makeAvatarSrc(url, updatedAt) {
  const base = resolveImageUrl(url) || DEFAULT_IMAGE_PATH;
  if (!updatedAt) return base;
  const ms = Date.parse(updatedAt);
  if (Number.isNaN(ms)) return base;
  return withQuery(base, "v", ms); // 캐시 버스터
}

function pickAuthorId(obj) {
  const flat =
    obj?.authorId ??
    obj?.userId ??
    obj?.writerId ??
    obj?.memberId ??
    obj?.accountId ??
    null;
  if (flat != null) return String(flat);
  const nested =
    obj?.author?.id ??
    obj?.user?.id ??
    obj?.writer?.id ??
    obj?.member?.id ??
    obj?.account?.id ??
    null;
  return nested != null ? String(nested) : null;
}

function pickNickname(obj) {
  const flat =
    obj?.authorNickname ??
    obj?.nickname ??
    obj?.userNickname ??
    obj?.writerNickname ??
    obj?.memberNickname ??
    obj?.authorName ??
    obj?.name ??
    null;
  if (flat) return String(flat);
  const nested =
    obj?.author?.nickname ??
    obj?.author?.name ??
    obj?.user?.nickname ??
    obj?.user?.name ??
    obj?.writer?.nickname ??
    obj?.writer?.name ??
    obj?.member?.nickname ??
    obj?.member?.name ??
    null;
  return nested ? String(nested) : null;
}

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
  const [filter, setFilter] = useState("all"); // "all" | "likes" | "bookmarks"
  const { me } = useMe();

  const page = parseInt(params.get("page") || "0", 10);
  const size = 10;

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
        const pageData = res?.data ?? res;

        // 표준화
        const normalizePost = (raw) => {
          const post = raw?.post ?? raw;
          const id = post?.id ?? post?.postId;
          if (!id) return null;

          return {
            ...post,
            id,
            title: post?.title ?? post?.postTitle ?? "(제목 없음)",
            createdAt: post?.createdAt ?? raw?.createdAt ?? null,
            authorNickname:
              post?.authorNickname ??
              post?.author?.nickname ??
              pickNickname(post) ??
              "익명",
            authorId: pickAuthorId(post),
            // ✅ 백엔드가 내려준 프로필 이미지/업데이트 시각을 그대로 보관
            authorProfileImageUrl: post?.authorProfileImageUrl ?? null,
            authorProfileImageUpdatedAt: post?.authorProfileImageUpdatedAt ?? null,
          };
        };

        const rows = (pageData?.content ?? []).map(normalizePost).filter(Boolean);

        setData({
          content: rows,
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
            className={`${styles.filterButton} ${filter === "all" ? styles.active : ""}`}
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
                className={`${styles.filterButton} ${filter === "likes" ? styles.active : ""}`}
              >
                좋아요
              </button>
              <button
                onClick={() => {
                  setFilter("bookmarks");
                  go(0);
                }}
                className={`${styles.filterButton} ${filter === "bookmarks" ? styles.active : ""}`}
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
            <Link
              key={p.id}
              to={`/community/posts/${p.id}`}
              state={{ from: "list" }}
              className={styles.postItem}
            >
              <div className={styles.postRow}>
                <div className={styles.metaLeft}>
                  {/* ✅ 추가 fetch 제거: 응답 값만으로 이미지 렌더 */}
                  <img
                    className={styles.avatar}
                    alt="author avatar"
                    src={makeAvatarSrc(p.authorProfileImageUrl, p.authorProfileImageUpdatedAt)}
                    onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_PATH; }}
                  />
                  <div>
                    <div className={styles.postTitle}>{p.title}</div>
                    <div className={styles.postMeta}>
                      {p.authorNickname ?? "익명"} ·{" "}
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
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
