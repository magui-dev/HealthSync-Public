import { useEffect, useRef, useState } from "react";

const normalizeTag = (s) => s.trim().toLowerCase().slice(0, 100);
const uniq = (arr) => Array.from(new Set(arr));

export default function TagInput({
  value = [],
  onChange,
  placeholder = "태그를 입력하고 Enter 또는 , 를 누르세요",
  maxTags = 10,
  fetchSuggestions, // async (q) => string[]
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef(null);

  // 입력 변화 시 자동완성 가져오기 (디바운스 200ms)
  useEffect(() => {
    if (!fetchSuggestions) return;
    const q = input.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(q);
        // 이미 선택된 태그는 제외
        const filtered = list
          .map(normalizeTag)
          .filter((t) => t && !value.includes(t));
        setSuggestions(filtered.slice(0, 10));
        setOpen(true);
        setHighlight(filtered.length ? 0 : -1);
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(id);
  }, [input, fetchSuggestions, value]);

  // 바깥 클릭 시 자동완성 닫기
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addTag = (raw) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (value.length >= maxTags) return;
    if (value.includes(t)) return;
    onChange(uniq([...value, t]));
    setInput("");
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
  };

  const removeTag = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onKeyDown = (e) => {
    // 콤마 또는 엔터로 태그 확정
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
      return;
    }
    // 백스페이스: 입력이 비었으면 마지막 태그 삭제
    if (e.key === "Backspace" && !input && value.length) {
      e.preventDefault();
      removeTag(value.length - 1);
      return;
    }
    // 자동완성 탐색
    if (open && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Tab") {
        // Tab으로 선택
        e.preventDefault();
        if (highlight >= 0) addTag(suggestions[highlight]);
      }
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    // 쉼표/스페이스/줄바꿈 기준 분리
    const parts = text
      .split(/,|\n|\r|\t|\s+/g)
      .map(normalizeTag)
      .filter(Boolean);
    if (!parts.length) return;
    e.preventDefault();
    let next = [...value];
    for (const t of parts) {
      if (next.length >= maxTags) break;
      if (!next.includes(t)) next.push(t);
    }
    onChange(uniq(next));
    setInput("");
  };

  return (
    <div className="tagbox" ref={boxRef}>
      <div className="tagbox-control" onClick={() => setOpen(true)}>
        {value.map((t, i) => (
          <span key={t} className="tag-chip">
            <span className="tag-text">#{t}</span>
            <button type="button" className="tag-remove" onClick={() => removeTag(i)} aria-label={`${t} 제거`}>
              ✕
            </button>
          </span>
        ))}
        <input
          className="tag-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={value.length ? "" : placeholder}
          onFocus={() => input && setOpen(true)}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="tag-suggest">
          {suggestions.map((s, i) => (
            <li
              key={s}
              className={`tag-suggest-item ${i === highlight ? "active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              #{s}
            </li>
          ))}
        </ul>
      )}

      <div className="tag-hint">
         Enter 또는 , 로 추가 (최대 {maxTags}개)
      </div>
    </div>
  );
}
