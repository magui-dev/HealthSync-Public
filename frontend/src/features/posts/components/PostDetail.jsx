import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getPost,
  deletePost,
  listComments,
  addComment,
  updateComment,
  deleteComment,
  // 1. 좋아요/북마크 API 함수 추가
  likePost,
  unlikePost,
  toggleBookmark,
  likedByMe,
} from "../api";
import { useMe } from "../../../hooks/useMe";

export default function PostDetail() {
  const { postId } = useParams();
  const nav = useNavigate();
  const { me } = useMe();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 2. 좋아요/북마크 상태 추가
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // --- 기존 헬퍼 함수들은 그대로 유지 ---
  const pickAuthorId = (obj) => {
    const flat = obj?.authorId ?? obj?.userId ?? obj?.writerId ?? obj?.memberId ?? obj?.accountId ?? null;
    if (flat != null) return String(flat);
    const nested = obj?.author?.id ?? obj?.user?.id ?? obj?.writer?.id ?? obj?.member?.id ?? obj?.account?.id ?? null;
    return nested != null ? String(nested) : null;
  };
  const myId = useMemo(() => (me?.userId ? String(me.userId) : null), [me]);
  const isMine = (obj) => {
    if (obj?.mine === true) return true;
    const aid = pickAuthorId(obj);
    if (aid != null && myId != null && aid === myId) return true;
    return false;
  };

  // 3. 데이터 로딩 로직 수정 (안정적인 순차 로딩 방식)
  useEffect(() => {
    setLoading(true);
    setErr("");
    getPost(postId, { increaseView: true })
      .then(postData => {
        setPost(postData);
        setLikeCount(postData.likesCount ?? postData.likeCount ?? 0);
        setIsBookmarked(postData.bookmarkedByMe ?? false);
        reloadComments();
        if (me) {
          return likedByMe(postId);
        }
        return null;
      })
      .then(likedData => {
        if (likedData) {
          setIsLiked(likedData.likedByMe ?? false);
        }
      })
      .catch((e) => setErr(e?.message || "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [postId, me]);

  // --- 기존 댓글 관련 함수들 모두 복구 ---
  const reloadComments = async () => {
    try {
      const res = await listComments(postId, { page: 0, size: 20 });
      setComments(res.content ?? res);
    } catch {
      setComments([]);
    }
  };

  const onDelete = async () => {
    if (!confirm("삭제할까요?")) return;
    await deletePost(postId);
    nav("/community/posts");
  };
  
  const onAddComment = async (e) => {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get("text")?.toString().trim();
    if (!text) return;
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      authorNickname: me?.nickname ?? me?.name ?? "나",
      mine: true,
      __optimistic: true,
    };
    setComments((prev) => [optimistic, ...prev]);
    e.currentTarget.reset();
    try {
      const created = await addComment(postId, { content: text });
      if (created && created.id) {
        setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...created, mine: true } : c)));
      } else {
        reloadComments();
      }
    } catch (err) {
      alert(err?.message || "등록 실패");
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    }
  };

  const onEditComment = async (c) => {
    const next = window.prompt("댓글 수정", c.content || "");
    if (next == null) return;
    try {
      await updateComment(postId, c.id, { content: next });
      setComments((prev) => prev.map((item) => (item.id === c.id ? { ...item, content: next } : item)));
    } catch (e) {
      alert(e?.message || "수정 실패");
    }
  };

  const onDeleteComment = async (c) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    try {
      await deleteComment(postId, c.id);
      setComments((prev) => prev.filter((item) => item.id !== c.id));
    } catch (e) {
      alert(e?.message || "삭제 실패");
    }
  };

  // 4. 좋아요/북마크 버튼 클릭 핸들러 추가
  const handleLike = async () => {
    if (!me) { alert("로그인이 필요합니다."); return; }
    const originalLiked = isLiked;
    const originalCount = likeCount;
    setIsLiked(!originalLiked);
    setLikeCount(originalCount + (!originalLiked ? 1 : -1));
    try {
      if (!originalLiked) await likePost(postId);
      else await unlikePost(postId);
    } catch (error) {
      alert(error.message || "요청 실패");
      setIsLiked(originalLiked);
      setLikeCount(originalCount);
    }
  };

  const handleBookmark = async () => {
    if (!me) { alert("로그인이 필요합니다."); return; }
    const originalBookmarked = isBookmarked;
    setIsBookmarked(!originalBookmarked);
    try {
      await toggleBookmark(postId);
    } catch (error) {
      alert(error.message || "요청 실패");
      setIsBookmarked(originalBookmarked);
    }
  };

  // --- 렌더링 부분 ---
  if (loading) return <div>로딩...</div>;
  if (err) return <div>{err}</div>;
  if (!post) return <div>게시글이 없습니다.</div>;

  const canEditPost = isMine(post);

  return (
    <div style={{ maxWidth: 920, margin: "24px auto", padding: 16 }}>
      {/* 상단 UI */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => nav(-1)}>← 목록</button>
        {canEditPost && (
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="edit">수정</Link>
            <button onClick={onDelete}>삭제</button>
          </div>
        )}
      </div>

      {/* 게시글 본문 */}
      <h1 style={{ margin: "8px 0" }}>{post.title}</h1>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        {(post.authorNickname ?? post.author) || "익명"} · {new Date(post.createdAt).toLocaleString()}
      </div>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
        {post.contentTxt ?? post.content ?? ""}
      </div>

      {/* 5. 좋아요/북마크 UI(버튼) 추가 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 24, padding: '12px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: isLiked ? 'crimson' : 'black', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'crimson' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>좋아요 {likeCount}</span>
        </button>
        <button onClick={handleBookmark} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: isBookmarked ? '#f59e0b' : 'black', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <span>북마크</span>
        </button>
      </div>

      {/* 댓글 UI (모두 복구) */}
      <h2 style={{ marginTop: 24, marginBottom: 8 }}>댓글</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {comments.map((c) => (
          <li key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 8, opacity: c.__optimistic ? 0.7 : 1 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {(c.authorNickname ?? c.author) || "익명"} · {new Date(c.createdAt).toLocaleString()}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>
            {isMine(c) && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => onEditComment(c)}>수정</button>
                <button type="button" onClick={() => onDeleteComment(c)}>삭제</button>
              </div>
            )}
          </li>
        ))}
        {comments.length === 0 && <li>첫 댓글을 남겨보세요.</li>}
      </ul>
      <form onSubmit={onAddComment} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input name="text" placeholder="댓글 달기..." style={{ flex: 1, padding: 8 }} />
        <button>등록</button>
      </form>
    </div>
  );
}