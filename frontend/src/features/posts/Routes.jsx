import { Routes, Route, Navigate } from "react-router-dom";
import PostList from "./components/PostList";
import PostDetail from "./components/PostDetail";
import PostEditor from "./components/PostEditor";
import PostsLayout from "./components/PostsLayout";
import MyPosts from "./components/MyPosts"; 

export default function PostRoutes() {
  return (
    <Routes>
      {/* 🔹 여기서만 상단 여백을 적용 */}
      <Route element={<PostsLayout fallback={72} />}>
        <Route index element={<PostList />} />
        <Route path="new" element={<PostEditor />} />
        <Route path="myposts" element={<MyPosts />} />
        <Route path=":postId" element={<PostDetail />} />
        <Route path=":postId/edit" element={<PostEditor />} />
      </Route>

      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
