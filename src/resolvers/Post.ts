import { GraphQLResolveInfo } from "graphql";
import { ResolverContext } from "../types/resolverTypes.js";
import { Post } from "../types/post.js";

export const Posts = {
  author: (
    parent: Post,
    args: unknown,
    { users }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return users.find((user) => user.id === parent.authorId) || null;
  },

  comments: (
    parent: Post,
    args: unknown,
    { comments }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return comments.filter((comment) => comment.postId === parent.id) || null;
  },
};
