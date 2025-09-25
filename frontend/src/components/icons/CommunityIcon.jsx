export default function CommunityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* 뒷쪽 말풍선 (밝은 회색, 위/오른쪽) */}
      <ellipse cx="15" cy="8" rx="7" ry="5" fill="#E5E7EB" />
      {/* 꼬리: 폭 넓고 짧은 삼각형 */}
      <polygon points="13,11 17,15 11,11" fill="#E5E7EB" />

      {/* 앞쪽 말풍선 (메인 컬러, 아래/왼쪽) */}
      <ellipse cx="9" cy="13" rx="7" ry="5" fill="#F472B6" />
      {/* 꼬리: 폭 넓고 짧은 삼각형 */}
      <polygon points="7,17 11,21 5,17" fill="#F472B6" />
    </svg>
  );
}
