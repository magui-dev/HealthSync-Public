export interface Post {
  id: number;
  title: string;
  content: string;
  authorNickname?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  likeCount?: number;
  tags?: string[];
  thumbnailUrl?: string;
}
