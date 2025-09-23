import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { myPosts } from "../api";
import "./MyPosts.css"; // CSS 파일을 불러옵니다.

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
  const [sort, setSort] = useState("createdAt,desc");

  useEffect(() => {
    setLoading(true);
    setError("");
    myPosts({ page: 0, size: 10, sort: sort })
      .then((res) => {
        setPosts(res.content ?? res);
      })
      .catch((e) => setError(e?.message || "글을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [sort]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === FILTERS.PUBLIC) {
      return posts.filter((p) => p.visibility === "PUBLIC");
    }
    if (activeFilter === FILTERS.PRIVATE) {
      return posts.filter((p) => p.visibility === "PRIVATE");
    }
    return posts;
  }, [posts, activeFilter]);

  return (
    <div className="my-posts-container">
      <div className="my-posts-header">
        <h1 className="my-posts-title">내 작성글</h1>
        <Link to="/community/posts" className="all-posts-link">
          전체 글 목록
        </Link>
      </div>

      <div className="controls-bar">
        <div className="filter-group">
          <button
            onClick={() => setActiveFilter(FILTERS.ALL)}
            className={`filter-button ${
              activeFilter === FILTERS.ALL ? "active" : ""
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveFilter(FILTERS.PUBLIC)}
            className={`filter-button ${
              activeFilter === FILTERS.PUBLIC ? "active" : ""
            }`}
          >
            공개
          </button>
          <button
            onClick={() => setActiveFilter(FILTERS.PRIVATE)}
            className={`filter-button ${
              activeFilter === FILTERS.PRIVATE ? "active" : ""
            }`}
          >
            비공개
          </button>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="sort-select"
        >
          <option value="createdAt,desc">최신순</option>
          <option value="createdAt,asc">오래된순</option>
        </select>
      </div>

      {loading && <div>로딩 중...</div>}
      {!!error && <div className="error-message">{error}</div>}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="empty-message">
          {activeFilter === FILTERS.ALL
            ? "작성한 글이 없습니다."
            : "해당 조건에 맞는 글이 없습니다."}
        </div>
      )}

      <div>
        {!loading &&
          !error &&
          filteredPosts.map((p) => (
            <div key={p.id} className="post-item">
              <Link
                to={`/community/posts/${p.id}`}
                className="post-item-link"
              >
                <div className="post-item-header">
                  {p.visibility === "PRIVATE" && (
                    <span className="visibility-tag">비공개</span>
                  )}
                  <span className="post-item-title">{p.title}</span>
                </div>
                <div className="post-item-meta">
                  {new Date(p.createdAt).toLocaleString()}
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}