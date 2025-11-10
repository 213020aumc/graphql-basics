import { GraphQLError } from "graphql";
import type { ResolverContext } from "../types/resolverTypes.js";
import { toAsyncIterator } from "../utils.js";

export const Subscription = {
  comment: {
    subscribe(
      parent: unknown,
      { postId }: { postId: string },
      { pubsub, posts }: ResolverContext,
      info: unknown
    ) {
      const post = posts.find((post) => post.id === postId);
      if (!post || !post.published) {
        throw new GraphQLError("Post does not exist or is not published.", {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
        });
      }
      return toAsyncIterator(pubsub, `COMMENT_${postId}`);
    },
  },
  post: {
    subscribe(
      parent: unknown,
      args: unknown,
      { pubsub }: ResolverContext,
      info: unknown
    ) {
      return toAsyncIterator(pubsub, "POST");
    },
  },
};
