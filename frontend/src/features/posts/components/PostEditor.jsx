import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, getPost, updatePost } from "../api";
import "./PostEditor.css";
import TagInput from "../components/TagInput";

const VIS = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
};

async function fetchTagSuggestionsAPI(q) {
  const res = await fetch(
    `/posts/tags?query=${encodeURIComponent(q)}&size=10`,
    {
      credentials: "include",
    }
  );
  if (!res.ok) return [];
  return res.json();
}

export default function PostEditor() {
  const { postId } = useParams();
  const isEdit = Boolean(postId);
  const [form, setForm] = useState({ title: "", content: "" });
  const [visibility, setVisibility] = useState(VIS.PUBLIC);
  const [allowComment, setAllowComment] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();
  const [tags, setTags] = useState([]);
  const contentRef = useRef(null);

  function wrapSelection(prefix, suffix = "") {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const before = value.slice(0, s);
    const sel = value.slice(s, e);
    const after = value.slice(e);
    const next = before + prefix + sel + suffix + after;
    const cursor = (before + prefix + sel + suffix).length;
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  }

  function insertLineStart(token) {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const lineEnd = value.indexOf("\n", e);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const updated =
      value.slice(0, lineStart) + `${token}${line}` + value.slice(end);
    setForm((prev) => ({ ...prev, content: updated }));
    requestAnimationFrame(() => ta.focus());
  }

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await getPost(postId);
        const title = p?.title ?? "";
        const content = p?.contentTxt ?? p?.content ?? "";
        const rawVis = p?.visibility;
        const vis = rawVis === VIS.PRIVATE ? VIS.PRIVATE : VIS.PUBLIC;
        const block = p?.blockComment === true;
        const initialTags = Array.isArray(p?.tags)
          ? p.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
          : [];

        setForm({ title, content });
        setVisibility(vis);
        setAllowComment(!block);
        setTags(initialTags);
      } catch {
        // ignore error
      }
    })();
  }, [isEdit, postId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      visibility,
      blockComment: !allowComment,
      tags,
    };

    try {
      if (isEdit) {
        await updatePost(postId, payload);
        nav(`/community/posts/${postId}`, { replace: true });
        return;
      }

      const res = await createPost(payload);
      const data = res?.data ?? res;
      const createdId =
        data?.id ??
        data?.postId ??
        data?.result?.id ??
        data?.data?.id ??
        data?.payload?.id;

      if (!createdId) {
        nav("/community/myposts");
        return;
      }

      nav(`/community/posts/${createdId}`, { replace: true });
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "저장에 실패했습니다"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="post-editor-container">
      <div className="editor-header">
        <button onClick={() => nav(-1)} className="back-button">
          ← 뒤로
        </button>
        <h1 className="editor-title">{isEdit ? "게시글 수정" : "글쓰기"}</h1>
        <div className="header-placeholder" />
      </div>

      {!!error && <div className="error-message">{error}</div>}

      <form onSubmit={onSubmit} className="editor-form">
        <input
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="form-input title-input"
        />

        <fieldset className="options-fieldset">
          <legend className="options-legend">내용</legend>

          <div className="md-toolbar">
            <button
              type="button"
              onClick={() => wrapSelection("**", "**")}
              title="굵게"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => wrapSelection("*", "*")}
              title="기울임"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => wrapSelection("`", "`")}
              title="코드"
            >{`</>`}</button>
            <button
              type="button"
              onClick={() => insertLineStart("> ")}
              title="인용"
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => insertLineStart("- ")}
              title="불릿"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => insertLineStart("1. ")}
              title="번호"
            >
              1.
            </button>
            <button
              type="button"
              onClick={() => wrapSelection("[텍스트](", ")")}
              title="링크"
            >
              🔗
            </button>
          </div>

          <textarea
            ref={contentRef}
            placeholder="내용을 입력하세요. 마크다운 문법을 사용할 수 있습니다."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={12}
            className="form-input content-textarea mono"
          />
        </fieldset>

        <fieldset className="options-fieldset">
          <legend className="options-legend">태그</legend>
          <TagInput
            value={tags}
            onChange={setTags}
            fetchSuggestions={fetchTagSuggestionsAPI}
            maxTags={10}
            placeholder="태그를 입력하고 Enter"
          />
        </fieldset>

        <fieldset className="options-fieldset">
          <legend className="options-legend">공개 범위</legend>
          <p className="options-description">
            게시글을 누구에게 공개할지 선택하세요. 필요 시 나중에 수정할 수
            있습니다.
          </p>
          <div className="visibility-grid">
            <label
              className={`visibility-option ${
                visibility === VIS.PUBLIC ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={VIS.PUBLIC}
                checked={visibility === VIS.PUBLIC}
                onChange={() => setVisibility(VIS.PUBLIC)}
                className="option-radio"
              />
              <div>
                <div className="option-title">공개</div>
                <div className="option-description">
                  모든 사용자에게 노출됩니다.
                </div>
              </div>
            </label>

            <label
              className={`visibility-option ${
                visibility === VIS.PRIVATE ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={VIS.PRIVATE}
                checked={visibility === VIS.PRIVATE}
                onChange={() => setVisibility(VIS.PRIVATE)}
                className="option-radio"
              />
              <div>
                <div className="option-title">비공개</div>
                <div className="option-description">나만 볼 수 있습니다.</div>
              </div>
            </label>
          </div>
        </fieldset>

        <div className="comment-toggle">
          <label htmlFor="allow-comment" className="comment-toggle-label">
            댓글 허용
          </label>
          <input
            id="allow-comment"
            type="checkbox"
            checked={allowComment}
            onChange={(e) => setAllowComment(e.target.checked)}
            className="comment-toggle-checkbox"
          />
        </div>

        <div className="form-actions">
          <button disabled={saving} className="submit-button">
            {isEdit ? "저장" : "등록"}
          </button>
          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={saving}
            className="cancel-button"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}