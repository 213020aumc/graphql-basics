import { GraphQLResolveInfo } from "graphql";
import { ResolverContext } from "../types/resolverTypes.js";
import { Comment } from "../types/comment.js";

export const Comments = {
  commentAuthor: (
    parent: Comment,
    args: unknown,
    { users, posts }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return users.find((user) => user.id === parent.commentAuthorId) || null;
  },
  post: (
    parent: Comment,
    args: unknown,
    { posts }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return posts.find((post) => post.id === parent.postId) || null;
  },
};
