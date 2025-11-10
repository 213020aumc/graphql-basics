// src/types/resolverTypes.ts

type ResolverContext = {
  users: import("./user").User[];
  posts: import("./post").Post[];
  comments: import("./comment").Comment[];
  pubsub: import("./appContext").PubSubLike;
  saveUsers: () => void;
  savePosts: () => void;
  saveComments: () => void;
}; // Add auth/session if needed

type GreetingArgs = { name?: string };
type UserArgs = { query?: string };
type AddArgs = { number: number[] };
type PostArgs = { query?: string };

type createUserArgs = { id: string; name: string; email: string; age: number };
type createPostArgs = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  authorId: string;
};

type createCommentArgs = {
  id: string;
  text: string;
  commentAuthorId: string;
  postId: string;
};

export {
  ResolverContext,
  GreetingArgs,
  UserArgs,
  AddArgs,
  PostArgs,
  createUserArgs,
  createPostArgs,
  createCommentArgs,
};
