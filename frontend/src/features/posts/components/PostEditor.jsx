import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, getPost, updatePost } from "../api";

const VIS = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
};

export default function PostEditor() {
  const { postId } = useParams();
  const isEdit = Boolean(postId);
  const [form, setForm] = useState({ title: "", content: "" });
  const [visibility, setVisibility] = useState(VIS.PUBLIC);
  const [allowComment, setAllowComment] = useState(true); // UI는 '허용' 기준
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await getPost(postId);
        const title = p?.title ?? "";
        const content = p?.contentTxt ?? p?.content ?? "";
        // 서버에서 혹시 UNLISTED가 와도 사용 안 하므로 PUBLIC로 보정
        const rawVis = p?.visibility;
        const vis = rawVis === VIS.PRIVATE ? VIS.PRIVATE : VIS.PUBLIC;
        const block = p?.blockComment === true; // undefined면 false로 간주

        setForm({ title, content });
        setVisibility(vis);
        setAllowComment(!block);
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
  setSaving(true); setError("");

  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    visibility,
    blockComment: !allowComment,
  };

  try {
    if (isEdit) {
      await updatePost(postId, payload);
      nav(`/community/posts/${postId}`, { replace: true }); // 수정→상세(작성/수정 폼 히스토리 제거)
      return;
    }

    const res = await createPost(payload);
    const data = res?.data ?? res;
    const createdId =
      data?.id ?? data?.postId ?? data?.result?.id ?? data?.data?.id ?? data?.payload?.id;

    if (!createdId) {
      // id를 못 받으면 안전하게 내 글 목록으로
      nav("/community/myposts");
      return;
    }

    if (visibility === "PRIVATE") {
      try {
        await getPost(createdId);          // 상세 접근 가능? (작성자라면 OK)
        nav(`/community/posts/${createdId}`, { replace: true });
      } catch {
        nav("/community/myposts", { replace: true });     // 혹시 403/401이면 내 글 목록으로
      }
    } else {
      nav("/community/posts", { replace: true });           // PUBLIC은 공개 목록
    }
  } catch (e) {
    setError(e?.response?.data?.message || e?.message || "저장에 실패했습니다");
  } finally {
    setSaving(false);
  }
};

  return (
    <div style={{ maxWidth: 920, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => nav(-1)}>← 뒤로</button>
        <h1 style={{ margin: 0 }}>{isEdit ? "게시글 수정" : "새 글 작성"}</h1>
        <div />
      </div>

      {!!error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ padding: 10 }}
        />

        <textarea
          placeholder="내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={12}
          style={{ padding: 10 }}
        />

        {/* 공개 범위: PUBLIC / PRIVATE 두 가지 */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginTop: 4 }}>
          <legend style={{ padding: "0 6px", fontSize: 13, fontWeight: 600 }}>공개 범위</legend>
          <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#6b7280" }}>
            게시글을 누구에게 공개할지 선택하세요. 필요 시 나중에 수정할 수 있습니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {/* PUBLIC */}
            <label
              style={{
                display: "flex",
                gap: 8,
                border: `1px solid ${visibility === VIS.PUBLIC ? "#111827" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: 10,
                cursor: "pointer",
                alignItems: "flex-start",
              }}
            >
              <input
                type="radio"
                name="visibility"
                value={VIS.PUBLIC}
                checked={visibility === VIS.PUBLIC}
                onChange={() => setVisibility(VIS.PUBLIC)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>공개</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>모든 사용자에게 노출됩니다.</div>
              </div>
            </label>

            {/* PRIVATE */}
            <label
              style={{
                display: "flex",
                gap: 8,
                border: `1px solid ${visibility === VIS.PRIVATE ? "#111827" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: 10,
                cursor: "pointer",
                alignItems: "flex-start",
              }}
            >
              <input
                type="radio"
                name="visibility"
                value={VIS.PRIVATE}
                checked={visibility === VIS.PRIVATE}
                onChange={() => setVisibility(VIS.PRIVATE)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>비공개</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>나만 볼 수 있습니다.</div>
              </div>
            </label>
          </div>
        </fieldset>

        {/* 댓글 허용 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
          <label htmlFor="allow-comment" style={{ userSelect: "none", fontSize: 14 }}>댓글 허용</label>
          <input
            id="allow-comment"
            type="checkbox"
            checked={allowComment}
            onChange={(e) => setAllowComment(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={saving}>{isEdit ? "저장" : "등록"}</button>
          <button type="button" onClick={() => nav(-1)} disabled={saving}>취소</button>
        </div>
      </form>
    </div>
  );
}
