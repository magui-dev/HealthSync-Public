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
import "./PostDetail.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_IMAGE_PATH = "/images/profile-images/default.png";

const API_ORIGIN =
  (import.meta?.env && import.meta.env.VITE_API_ORIGIN) ||
  "http://localhost:8080";

function resolveImageUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^images\//i.test(u)) u = "/" + u;
  if (u.startsWith("/images/")) return u;
  if (u.startsWith("/")) return API_ORIGIN + u;
  return `${API_ORIGIN}/${u}`;
}

function withQuery(url, key, val) {
  if (!url) return url;
  const u = /^https?:\/\//i.test(url)
    ? new URL(url)
    : new URL(url, window.location.origin);
  u.searchParams.set(key, String(val));
  return u.toString();
}

function makeAvatarSrc(url, updatedAt) {
  const base = resolveImageUrl(url) || DEFAULT_IMAGE_PATH;
  if (!updatedAt) return base;
  const ms = Date.parse(updatedAt);
  if (Number.isNaN(ms)) return base;
  return withQuery(base, "v", ms);
}

export default function PostDetail() {
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

  const pickNickname = (obj) => {
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
  };

  const myId = useMemo(() => {
    const v = me?.userId ?? me?.id ?? null;
    return v != null ? String(v) : null;
  }, [me]);

  const isMine = (obj) => {
    if (obj?.mine === true) return true;
    const aid = pickAuthorId(obj);
    if (aid != null && myId != null && aid === myId) return true;
    return false;
  };

  const displayName = (obj) =>
    obj?.authorNickname ??
    pickNickname(obj) ??
    (typeof obj?.author === "string" ? obj.author : null);

  const reloadComments = async () => {
    try {
      const res = await listComments(postId, { page: 0, size: 20 });
      const raw = res.content ?? res;
      const normalized = raw.map((c) => {
        const mine = isMine(c);
        const nick =
          displayName(c) ?? (mine ? me?.nickname || me?.name || "나" : null);
        return {
          ...c,
          mine,
          authorNickname: c.authorNickname ?? nick ?? undefined,
        };
      });
      setComments(normalized);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    let alive = true;
    const loadPostData = async () => {
      setLoading(true);
      setErr("");
      try {
        const postData = await getPost(postId, { increaseView: true });
        if (!alive) return;
        setPost(postData);
        setLikeCount(postData.likesCount ?? 0);
        setIsLiked(postData.likedByMe ?? false);
        setIsBookmarked(postData.bookmarkedByMe ?? false);
        await reloadComments();
      } catch (e) {
        if (!alive) return;
        const status = e?.status ?? e?.response?.status;
        if (status === 410)
          setErr("삭제되었거나 더 이상 볼 수 없는 게시글입니다.");
        else if (status === 404) setErr("게시글을 찾을 수 없습니다.");
        else setErr(e?.message || "게시글을 불러오는 데 실패했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadPostData();
    return () => {
      alive = false;
    };
  }, [postId]);

  const onDelete = async () => {
    if (!confirm("삭제할까요?")) return;
    try {
      await deletePost(postId);
      alert("게시글이 삭제되었습니다.");
      goList();
    } catch (e) {
      alert(e?.message || "삭제 실패");
    }
  };

  const canWriteComment = useMemo(() => {
    if (
      !post ||
      post.blockComment === true ||
      (post.visibility === "PRIVATE" && !isMine(post))
    ) {
      return false;
    }
    return true;
  }, [post, me]);

  const onAddComment = async (e) => {
    e.preventDefault();
    if (!canWriteComment) return alert("이 게시글은 댓글이 차단되었습니다.");
    const text = new FormData(e.currentTarget).get("text")?.toString().trim();
    if (!text) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      authorNickname: me?.nickname ?? me?.name ?? "나",
      authorId: myId,
      mine: true,
      __optimistic: true,
    };
    setComments((prev) => [optimistic, ...prev]);
    e.currentTarget.reset();

    try {
      const created = await addComment(postId, { content: text });
      setComments((prev) =>
        prev.map((c) =>
          c.id === optimistic.id ? { ...created, mine: true } : c
        )
      );
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
    if (!me) return alert("로그인이 필요합니다.");
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
    if (!me) return alert("로그인이 필요합니다.");
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

  return (
    <div className="post-detail-container">
      <div className="post-header-container">
        <button onClick={goList} className="back-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>목록</span>
        </button>

        {canEditPost && (
          <div className="edit-actions">
            <Link to="edit" className="action-link">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>수정</span>
            </Link>
            <button onClick={onDelete} className="action-button danger">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>삭제</span>
            </button>
          </div>
        )}
      </div>
      <h1 className="post-title">{post.title}</h1>
      <div className="post-meta">
        <img
          className="post-author-avatar"
          alt="author avatar"
          src={makeAvatarSrc(
            post.authorProfileImageUrl,
            post.authorProfileImageUpdatedAt
          )}
          onError={(e) => {
            e.currentTarget.src = DEFAULT_IMAGE_PATH;
          }}
        />
        <span className="post-author-name">
          {post.authorNickname ?? pickNickname(post) ?? post.author ?? "익명"}
        </span>
        <span className="post-dot">·</span>
        {new Date(post.createdAt).toLocaleString()}
      </div>

      <div className="post-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.contentTxt ?? post.content ?? ""}
        </ReactMarkdown>
      </div>

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((t) => {
            const text = String(t).trim();
            if (!text) return null;
            return (
              <span key={text} className="post-tag">
                #{text}
              </span>
            );
          })}
        </div>
      )}

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

      <h2 className="comments-title">댓글</h2>
      <ul className="comment-list">
        {comments.map((c) => (
          <li
            key={c.id}
            className={`comment-item ${c.__optimistic ? "optimistic" : ""}`}
          >
            <div className="comment-body comment-body--no-avatar">
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
                    className="action-button edit"
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
            </div>
          </li>
        ))}
        {comments.length === 0 && canWriteComment && (
          <li className="no-comments">첫 댓글을 남겨보세요.</li>
        )}
      </ul>

      {canWriteComment && (
        <form onSubmit={onAddComment} className="comment-form">
          <input
            name="text"
            placeholder="댓글 달기..."
            className="comment-input"
          />
          <button className="comment-submit-button">등록</button>
        </form>
      )}
    </div>
  );
}