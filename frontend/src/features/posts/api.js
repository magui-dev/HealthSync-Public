import { http } from "../../lib/http";

/** -------- Posts -------- **/

// 공개글 목록 : GET /posts?page=&size=
export const listPosts = ({ page = 0, size = 10, sort = "createdAt,desc" } = {}) =>
  http.get(`/posts?page=${page}&size=${size}&sort=${sort}`);

// 상세 : GET /posts/{postId}?increaseView=boolean
export const getPost = (postId, { increaseView = false } = {}) =>
  http.get(`/posts/${postId}?increaseView=${increaseView}`);

// 생성 : POST /posts  (PostCreateRequest: title, contentTxt, ...)
export const createPost = ({
  title,
  content,
  visibility = "PUBLIC",
  blockComment = false,
  tags = [],
}) =>
  http.post(`/posts`, {
    title,
    contentTxt: content,
    contentJson: null,
    blockComment,
    visibility, // ✅ 필수 전송
    // goalId: null,
    // postDate: "yyyy-MM-dd",
    tags,
  });

// 수정 : PUT /posts/{postId} (PostUpdateRequest)
export const updatePost = (
  postId,
  { title, content, visibility = "PUBLIC", blockComment = false, tags = [] }
) =>
  http.put(`/posts/${postId}`, {
    title,
    contentTxt: content,
    contentJson: null,
    blockComment,
    visibility, // ✅ 필수 전송
    tags,
  });

// 삭제 : DELETE /posts/{postId}
export const deletePost = (postId) => http.delete(`/posts/${postId}`);

// 내 글 : GET /posts/mypost?page=&size=
export const myPosts = ({ page = 0, size = 10, sort = "createdAt,desc" } = {}) =>
  http.get(`/posts/mypost?page=${page}&size=${size}&sort=${sort}`);

// 조회수
export const getViewsCount = (postId) => http.get(`/posts/${postId}/views/count`);
export const increaseView = (postId) => http.post(`/posts/${postId}/views/increase`);

// 좋아요 (토글 아님!)
export const getLikesCount = (postId) => http.get(`/posts/${postId}/likes/count`);
export const likePost     = (postId) => http.post(`/posts/${postId}/likes`);
export const unlikePost   = (postId) => http.delete(`/posts/${postId}/likes`);
export const listLikers   = (postId, { page = 0, size = 20 } = {}) =>
  http.get(`/posts/${postId}/likes?page=${page}&size=${size}`);
export const likedByMe    = (postId) => http.get(`/posts/${postId}/mylike`);
// '좋아요'한 글 목록을 불러오는 API 함수입니다.
export const myLikes = ({ page = 0, size = 10, sort = "createdAt,desc" } = {}) =>
  http.get(`/posts/me/likes?page=${page}&size=${size}&sort=${sort}`);


/** -------- Bookmarks -------- **/
export const addBookmark    = (postId) => http.post(`/posts/${postId}/bookmarks`);
export const removeBookmark = (postId) => http.delete(`/posts/${postId}/bookmarks`);
export const toggleBookmark = (postId) => http.post(`/posts/${postId}/bookmarks/toggle`);
export const myBookmarks    = ({ page = 0, size = 10 } = {}) =>
  http.get(`/posts/me/bookmarks?page=${page}&size=${size}`);

/** -------- Tags -------- **/
// 태그로 공개글 검색
export const postsByTag = (tag, { page = 0, size = 10 } = {}) =>
  http.get(`/posts/by-tag?tag=${encodeURIComponent(tag)}&page=${page}&size=${size}`);

// 내 글의 태그/통계
export const myTags     = () => http.get(`/posts/mypost/tags`);
export const myTagStats = () => http.get(`/posts/mypost/tags/stats`);

// 자동완성/인기
export const allTags     = (query = "", size = 10) =>
  http.get(`/posts/tags?query=${encodeURIComponent(query)}&size=${size}`);
export const popularTags = (limit = 20) =>
  http.get(`/posts/tags/popular?limit=${limit}`);

/** -------- Comments -------- **/
// 댓글 목록 : GET /posts/{postId}/comments?page=&size=
export const listComments = (postId, { page = 0, size = 10, sort = "createdAt,desc" } = {}) => {
  const bust = Date.now(); // 캐시 방지용
  return http.get(
    `/posts/${postId}/comments?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}&_=${bust}`
  );
};

 // 댓글 작성/수정 바디는 { content }
export const addComment    = (postId, { content }) =>
  http.post(`/posts/${postId}/comments`, { content });
export const updateComment = (postId, commentId, { content }) =>
  http.put(`/posts/${postId}/comments/${commentId}`, { content });
export const deleteComment = (postId, commentId) =>
  http.delete(`/posts/${postId}/comments/${commentId}`);
