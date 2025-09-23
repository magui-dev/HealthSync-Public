import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getPost,
  deletePost,
  listComments,
  addComment,
  updateComment,
  deleteComment,
  likePost,
  unlikePost,
  toggleBookmark,
} from "../api";
import { useMe } from "../../../hooks/useMe";
import "./PostDetail.css"; // CSS 파일을 불러옵니다.

export default function PostDetail() {
  // ... (데이터 로딩, 상태 관리, 핸들러 함수 등 모든 로직은 이전과 동일합니다) ...
  const { postId } = useParams();
  const nav = useNavigate();
  const { me } = useMe();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const loc = useLocation();
  const cameFromList =
    loc.state?.from === "list" || loc.state?.from === "myposts";
  const goList = () => {
    if (cameFromList) nav(-1);
    else nav("/community/posts", { replace: true });
  };
  const pickAuthorId = (obj) => {
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
  };
  const myId = useMemo(() => (me?.userId ? String(me.userId) : null), [me]);
  const isMine = (obj) => {
    if (obj?.mine === true) return true;
    const aid = pickAuthorId(obj);
    if (aid != null && myId != null && aid === myId) return true;
    return false;
  };

  useEffect(() => {
    const loadPostData = async () => {
      setLoading(true);
      setErr("");
      try {
        const postData = await getPost(postId, { increaseView: true });
        setPost(postData);
        setLikeCount(postData.likesCount ?? 0);
        setIsLiked(postData.likedByMe ?? false);
        setIsBookmarked(postData.bookmarkedByMe ?? false);
        reloadComments();
      } catch (e) {
        const status = e?.status ?? e?.response?.status;
        if (status === 410)
          setErr("삭제되었거나 더 이상 볼 수 없는 게시글입니다.");
        else if (status === 404) setErr("게시글을 찾을 수 없습니다.");
        else setErr(e?.message || "게시글을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadPostData();
  }, [postId]);

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
    try {
      await deletePost(postId);
      alert("게시글이 삭제되었습니다.");
      if (cameFromList) {
        nav(-1);
      } else {
        nav("/community/posts", { replace: true });
      }
    } catch (e) {
      alert(e?.message || "삭제 실패");
    }
  };
  const canWriteComment = useMemo(() => {
    if (!post) return false;
    if (post.blockComment === true) return false;
    if (post.visibility === "PRIVATE" && !isMine(post)) return false;
    return true;
  }, [post]);

 const onAddComment = async (e) => {
    e.preventDefault();
    if (!canWriteComment) {
      alert("이 게시글은 댓글이 차단되었습니다.");
      return;
    }
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
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === optimistic.id) {
              // 서버 응답(created)에 닉네임이 없으면 로그인한 사용자(me)의 닉네임을 수동으로 추가
              return {
                ...created,
                mine: true,
                authorNickname:
                  created.authorNickname ?? (me?.nickname || me?.name || "나"),
              };
            }
            return c;
          })
        );
      } else {
        reloadComments();
      }
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 403) {
        alert("이 게시글은 댓글이 차단되었습니다.");
      } else {
        alert(err?.message || "등록 실패");
      }
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    }
  };
  
  const onEditComment = async (c) => {
    const next = window.prompt("댓글 수정", c.content || "");
    if (next == null) return;
    try {
      await updateComment(postId, c.id, { content: next });
      setComments((prev) =>
        prev.map((item) =>
          item.id === c.id ? { ...item, content: next } : item
        )
      );
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
  const handleLike = async () => {
    if (!me) {
      alert("로그인이 필요합니다.");
      return;
    }
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
    if (!me) {
      alert("로그인이 필요합니다.");
      return;
    }
    const originalBookmarked = isBookmarked;
    setIsBookmarked(!originalBookmarked);
    try {
      await toggleBookmark(postId);
    } catch (error) {
      alert(error.message || "요청 실패");
      setIsBookmarked(originalBookmarked);
    }
  };

  if (loading) return <div>로딩...</div>;
  if (err)
    return (
      <div className="post-detail-container error-page">
        <div className="error-message">{err}</div>
        <button
          onClick={() => nav("/community/posts", { replace: true })}
          className="action-button"
        >
          목록으로
        </button>
      </div>
    );
  if (!post) return <div>게시글이 없습니다.</div>;

  const canEditPost = isMine(post);
  const isBlocked = post?.blockComment === true;

  return (
    <div className="post-detail-container">
      {/* 상단 UI */}
      <div className="post-header">
        <button onClick={goList} className="back-button">
          ← 목록
        </button>
        {canEditPost && (
          <div className="edit-actions">
            <Link to="edit" className="action-link">
              수정
            </Link>
            <button onClick={onDelete} className="action-button danger">
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 게시글 본문 */}
      <h1 className="post-title">{post.title}</h1>
      <div className="post-meta">
        {(post.authorNickname ?? post.author) || "익명"} ·{" "}
        {new Date(post.createdAt).toLocaleString()}
      </div>
      <div className="post-content">
        {post.contentTxt ?? post.content ?? ""}
      </div>

      {/* 좋아요/북마크 UI */}
      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`like-button ${isLiked ? "active" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>좋아요 {likeCount}</span>
        </button>
        <button
          onClick={handleBookmark}
          className={`bookmark-button ${isBookmarked ? "active" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>북마크</span>
        </button>
      </div>

      {/* 댓글 UI */}
      <h2 className="comments-title">댓글</h2>
      {isBlocked && (
        <div className="comment-blocked-notice">
          이 게시글은 작성자가 댓글을 차단했습니다.
        </div>
      )}

      <ul className="comment-list">
        {comments.map((c) => (
          <li
            key={c.id}
            className={`comment-item ${c.__optimistic ? "optimistic" : ""}`}
          >
            <div className="comment-meta">
              {c.authorNickname ?? "익명"} ·{" "}
              {new Date(c.createdAt).toLocaleString()}
            </div>
            <div className="comment-content">{c.content}</div>
            {isMine(c) && (
              <div className="comment-actions">
                <button
                  type="button"
                  onClick={() => onEditComment(c)}
                  className="action-button"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteComment(c)}
                  className="action-button danger"
                >
                  삭제
                </button>
              </div>
            )}
          </li>
        ))}
        {comments.length === 0 && canWriteComment && (
          <li className="no-comments">첫 댓글을 남겨보세요.</li>
        )}
      </ul>

      {canWriteComment ? (
        <form onSubmit={onAddComment} className="comment-form">
          <input
            name="text"
            placeholder="댓글 달기..."
            className="comment-input"
          />
          <button className="comment-submit-button">등록</button>
        </form>
      ) : (
        !isBlocked && (
          <div className="comment-disabled-notice">
            {post.visibility === "PRIVATE" && !isMine(post)
              ? "비공개 게시글은 작성자만 댓글을 남길 수 있어요."
              : "댓글 작성이 차단되었습니다."}
          </div>
        )
      )}
    </div>
  );
}