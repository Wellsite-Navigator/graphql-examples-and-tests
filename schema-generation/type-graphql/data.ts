import type { Post } from "./schema/post";
import type { User } from "./schema/user";

export const users: User[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

export const posts: Post[] = [
  { id: '1', title: 'Post 1', authorId: '1', editorId: '2' },
  { id: '2', title: 'Post 2', authorId: '1', editorId: '1' },
  { id: '3', title: 'Post 3', authorId: '2', editorId: '1' },
];