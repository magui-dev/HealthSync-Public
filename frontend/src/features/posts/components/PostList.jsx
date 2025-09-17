import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPosts, myBookmarks, myLikes } from "../api";
import { useMe } from "../../../hooks/useMe";

export default function PostList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ content: [], totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("createdAt,desc");
  const [filter, setFilter] = useState("all");
  const { me } = useMe();

  const page = parseInt(params.get("page") || "0", 10);
  const size = 10;

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setErr("");

    let apiCall;
    if (filter === "bookmarks") {
      apiCall = myBookmarks({ page, size, sort });
    } else if (filter === "likes") {
      apiCall = myLikes({ page, size, sort });
    } else {
      apiCall = listPosts({ page, size, sort });
    }

    apiCall
      .then((res) => {
        if ((filter === 'bookmarks' || filter === 'likes') && res.content) {
          const transformedContent = res.content.map(item => ({
            id: item.postId,
            title: item.postTitle,
            authorNickname: filter === 'bookmarks' ? '북마크된 글' : '좋아요 한 글',
            createdAt: item.createdAt,
          }));
          setData({ ...res, content: transformedContent });
        } else {
          setData(res);
        }
      })
      .catch((e) => setErr(e?.message || "불러오기에 실패했습니다"))
      .finally(() => setLoading(false));
  }, [page, sort, filter]);

  const go = (p) => setParams({ page: String(p) });

  const activeButtonStyle = { backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' };
  const defaultButtonStyle = { backgroundColor: '#f1f5f9', color: 'black', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' };

  return (
    <div style={{maxWidth: 920, margin: "24px auto", padding: 16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16}}>
        <h1 style={{margin:0}}>커뮤니티 게시판</h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link to="myposts">내 글</Link>
          <Link to="new">새 글</Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <button onClick={() => { setFilter("all"); go(0); }} style={filter === "all" ? activeButtonStyle : defaultButtonStyle}>
          전체글
        </button>
        {me && (
          <>
            <button onClick={() => { setFilter("likes"); go(0); }} style={filter === "likes" ? activeButtonStyle : defaultButtonStyle}>
              좋아요
            </button>
            <button onClick={() => { setFilter("bookmarks"); go(0); }} style={filter === "bookmarks" ? activeButtonStyle : defaultButtonStyle}>
              북마크
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8 }}>
          <option value="createdAt,desc">최신순</option>
          <option value="createdAt,asc">오래된순</option>
        </select>
      </div>

      {loading && <div>로딩 중...</div>}
      {!!err && <div style={{color:"crimson"}}>{err}</div>}
      {!loading && !err && data.content.length === 0 && <div>게시글이 없습니다.</div>}

      {!loading && !err && data.content.map((p) => (
        <div key={p.id} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:12}}>
          <Link to={`/community/posts/${p.id}`} style={{fontWeight:600, textDecoration:"none", color: 'inherit'}}>{p.title}</Link>
          <div style={{fontSize:12, color:"#64748b", marginTop:6}}>
            {(p.authorNickname ?? p.author) || "익명"} · {new Date(p.createdAt).toLocaleString()}
          </div>
        </div>
      ))}

      {!loading && data.totalPages > 1 && (
        <div style={{display:"flex", gap:8, alignItems:"center", justifyContent: 'center', marginTop:16}}>
          <button disabled={page===0} onClick={()=>go(page-1)}>이전</button>
          <span>{page+1} / {data.totalPages}</span>
          <button disabled={page+1>=data.totalPages} onClick={()=>go(page+1)}>다음</button>
        </div>
      )}
    </div>
  );
}