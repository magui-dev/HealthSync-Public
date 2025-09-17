import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { myPosts } from "../api";

const FILTERS = {
  ALL: "ALL",
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
};

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  // ✅ 1. 정렬 상태를 관리할 'sort' state를 추가합니다. 기본값은 최신순입니다.
  const [sort, setSort] = useState("createdAt,desc");

  useEffect(() => {
    setLoading(true);
    setError("");
    // ✅ 2. myPosts API를 호출할 때, 현재 'sort' 상태를 파라미터로 함께 보냅니다.
    myPosts({ page: 0, size: 10, sort: sort })
      .then((res) => {
        setPosts(res.content ?? res);
      })
      .catch((e) => setError(e?.message || "글을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [sort]); // ✅ 3. 'sort' 값이 변경될 때마다 이 useEffect가 다시 실행되어 API를 새로 호출합니다.

  const filteredPosts = useMemo(() => {
    if (activeFilter === FILTERS.PUBLIC) {
      return posts.filter((p) => p.visibility === "PUBLIC");
    }
    if (activeFilter === FILTERS.PRIVATE) {
      return posts.filter((p) => p.visibility === "PRIVATE");
    }
    return posts;
  }, [posts, activeFilter]);

  const activeButtonStyle = { backgroundColor: '#334155', color: 'white', border: 'none' };
  const defaultButtonStyle = { backgroundColor: '#f1f5f9', color: 'black', border: '1px solid #e5e7eb' };

  return (
    <div style={{ maxWidth: 920, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>내 작성글</h1>
        <Link to="/community/posts">전체 글 목록</Link>
      </div>

      {/* 필터와 정렬 UI를 한 줄에 배치합니다. */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        {/* 필터 버튼 그룹 */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setActiveFilter(FILTERS.ALL)} style={activeFilter === FILTERS.ALL ? activeButtonStyle : defaultButtonStyle}>
            전체
          </button>
          <button onClick={() => setActiveFilter(FILTERS.PUBLIC)} style={activeFilter === FILTERS.PUBLIC ? activeButtonStyle : defaultButtonStyle}>
            공개
          </button>
          <button onClick={() => setActiveFilter(FILTERS.PRIVATE)} style={activeFilter === FILTERS.PRIVATE ? activeButtonStyle : defaultButtonStyle}>
            비공개
          </button>
        </div>

        {/* ✅ 4. 정렬 옵션을 선택할 수 있는 드롭다운 메뉴를 추가합니다. */}
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8 }}>
          <option value="createdAt,desc">최신순</option>
          <option value="createdAt,asc">오래된순</option>
          {/* 백엔드 Post 엔티티에 views 필드가 있다면 아래 옵션도 사용 가능합니다. */}
          {/* <option value="views,desc">조회수순</option> */}
        </select>
      </div>

      {loading && <div>로딩 중...</div>}
      {!!error && <div style={{ color: "crimson" }}>{error}</div>}
      {!loading && !error && filteredPosts.length === 0 && (
        <div>{activeFilter === FILTERS.ALL ? "작성한 글이 없습니다." : "해당 조건에 맞는 글이 없습니다."}</div>
      )}

      {/* ... (게시글 목록을 렌더링하는 부분은 이전과 동일) ... */}
      {!loading && !error && filteredPosts.map((p) => (
        <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Link to={`/community/posts/${p.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              {p.visibility === "PRIVATE" && (
                <span style={{ background: "#64748b", color: "white", fontSize: 11, padding: "2px 6px", borderRadius: 99 }}>
                  비공개
                </span>
              )}
              <span>{p.title}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {new Date(p.createdAt).toLocaleString()}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}