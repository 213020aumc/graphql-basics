import type { User } from "./user.js";
import type { Post } from "./post.js";
import type { Comment } from "./comment.js";

/**
 * Minimal PubSub-like interface that exposes the runtime methods
 * your code actually uses (publish + asyncIterator). Use this
 * in AppContext so TypeScript knows asyncIterator exists.
 */
export interface PubSubLike {
  publish(triggerName: string, payload: unknown): void | Promise<void>;
  asyncIterator<T = any>(triggers: string | string[]): AsyncIterator<T>;
}

export type AppContext = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  saveUsers: () => void;
  savePosts: () => void;
  saveComments: () => void;
  pubsub: PubSubLike;
};
