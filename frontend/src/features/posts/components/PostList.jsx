// PostList.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPosts, myBookmarks, myLikes } from "../api";
import { useMe } from "../../../hooks/useMe";
import styles from "./PostList.module.css";

const avatarCache = new Map(); // userId -> url|null

// API 절대경로 보정 유틸
const API_ORIGIN =
  (import.meta?.env && import.meta.env.VITE_API_ORIGIN) ||
  "http://localhost:8080";
function resolveImageUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u; // 이미 절대경로면 그대로
  if (u.startsWith("/")) return API_ORIGIN + u; // "/images/..." -> "http://localhost:8080/images/..."
  return `${API_ORIGIN}/${u}`; // "images/..."  -> "http://localhost:8080/images/..."
}

async function fetchProfileImageUrl(userId) {
  if (userId == null) return null;
  const key = String(userId);
  if (avatarCache.has(key)) return avatarCache.get(key) ?? null;

  try {
    const res = await fetch(`http://localhost:8080/profile/${key}?t=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (res.status === 304) {
      return avatarCache.get(key) ?? null;
    }
    if (!res.ok) {
      avatarCache.set(key, null);
      return null;
    }
    
    let data = null;
    try {
      data = await res.json();
    } catch {
      avatarCache.set(key, null);
      return null;
    }

    const backendUrl = data?.profileImageUrl ?? null;

    // **** ✅ 핵심 수정 부분 ****
    // 백엔드가 보내준 URL이 '기본 이미지 경로'와 일치하는지 확인합니다.
    // 여기서는 간단하게 null이 아닌지, 그리고 특정 문자열을 포함하는지로 확인합니다.
    if (backendUrl && backendUrl.includes("/images/profile-images/")) {
      // 프론트엔드의 public 폴더를 가리키는 로컬 경로를 그대로 사용합니다.
      const localDefaultPath = backendUrl; 
      avatarCache.set(key, localDefaultPath);
      return localDefaultPath;
    }

    // 그 외의 실제 사용자 이미지 URL은 기존 로직대로 정상 처리합니다.
    const url = resolveImageUrl(backendUrl);
    avatarCache.set(key, url);
    return url;

  } catch {
    avatarCache.set(key, null);
    return null;
  }
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

function Avatar({ userId, className }) {
  const key = userId != null ? String(userId) : null;
  const [url, setUrl] = useState(key ? avatarCache.get(key) ?? null : null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (userId == null) {
        if (alive) setUrl(null);
        return;
      }
      const u = await fetchProfileImageUrl(userId);
      if (!alive) return;
      setUrl(u ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <img
      className={className ?? styles.avatar}
      src={url || "/default.png"}
      alt="author avatar"
      onError={(e) => {
        if (key) {
          avatarCache.set(key, null); // 이 URL은 실패했으므로 캐시를 null로 업데이트
        }
        e.currentTarget.src = "/default.png";
      }}
    />
  );
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
          };
        };

        const rows = (pageData?.content ?? [])
          .map(normalizePost)
          .filter(Boolean);

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
            <Link
              key={p.id}
              to={`/community/posts/${p.id}`}
              state={{ from: "list" }}
              className={styles.postItem}
            >
              <div className={styles.postRow}>
                <div className={styles.metaLeft}>
                  <Avatar userId={p.authorId} />
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
