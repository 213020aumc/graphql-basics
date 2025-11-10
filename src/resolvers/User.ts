import { GraphQLResolveInfo } from "graphql";
import { ResolverContext } from "../types/resolverTypes.js";
import { User } from "../types/user.js";
export const Users = {
  posts: (
    parent: User,
    args: unknown,
    { posts }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return posts.filter((post) => parent.postIds.includes(post.id));
  },

  comments: (
    parent: User,
    args: unknown,
    { comments }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return comments.filter((comment) => comment.commentAuthorId === parent.id);
  },
};
