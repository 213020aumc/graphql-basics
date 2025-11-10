import { GraphQLError, GraphQLResolveInfo } from "graphql";
import { v4 } from "uuid";
import {
  ResolverContext,
  createUserArgs,
  createPostArgs,
  createCommentArgs,
} from "../types/resolverTypes.js";
import { removeById, findById } from "../utils.js";

export const Mutation = {
  createUser: (
    parent: unknown,
    { data }: { data: createUserArgs },
    { users, saveUsers }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { name, email, age } = data;
    const emailTaken = users.some((user) => user.email === email);
    if (emailTaken) {
      throw new GraphQLError("User with Email already taken.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["createUser"],
      });
    }
    const newUser = {
      id: v4(),
      name,
      email,
      age: age || null,
      postIds: [],
    };
    users.push(newUser);
    saveUsers();
    return newUser;
  },

  // use full ctx here because we reassign posts/comments
  deleteUser: (
    parent: unknown,
    { id }: { id: string },
    ctx: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { removed: deletedUser } = removeById(ctx.users, id);
    if (!deletedUser) {
      throw new GraphQLError("User does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["deleteUser"],
      });
    }

    // remove posts by the user and their comments
    ctx.posts = ctx.posts.filter((post) => {
      const match = post.authorId === id;
      if (match) {
        ctx.comments = ctx.comments.filter(
          (comment) => comment.postId !== post.id
        );
      }
      return !match;
    });
    ctx.savePosts();

    // remove comments authored by the user
    ctx.comments = ctx.comments.filter(
      (comment) => comment.commentAuthorId !== id
    );
    ctx.saveComments();

    ctx.saveUsers();
    return deletedUser;
  },

  updateUser: (
    parent: unknown,
    {
      id,
      data,
    }: { id: string; data: { name?: string; email?: string; age?: number } },
    { users, saveUsers }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const user = users.find((user) => user.id === id);
    if (!user) {
      throw new GraphQLError("User does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["updateUser"],
      });
    }
    if (typeof data.email === "string") {
      const emailTaken = users.some(
        (otherUser) => otherUser.email === data.email && otherUser.id !== id
      );
      if (emailTaken) {
        throw new GraphQLError("Email is already taken by another user.", {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
          path: ["updateUser"],
        });
      }
      user.email = data.email;
    }
    if (typeof data.name === "string") {
      user.name = data.name;
    }
    if (typeof data.age !== "undefined") {
      user.age = data.age;
    }
    const updatedUser = {
      ...user,
      ...data,
    };
    users.splice(users.indexOf(user), 1, updatedUser);
    saveUsers();
    return updatedUser;
  },

  createPost: (
    parent: unknown,
    { data }: { data: createPostArgs },
    { users, posts, savePosts, pubsub }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { title, body, published, authorId } = data;
    const author = findById(users, authorId);
    if (!author) {
      throw new GraphQLError("User does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["createPost"],
      });
    }
    const newPost = {
      id: v4(),
      title,
      body,
      published: published || false,
      authorId,
    };
    posts.push(newPost);

    if (published) {
      pubsub.publish("POST", {
        post: {
          mutation: "CREATED",
          data: newPost,
        },
      });
    }
    savePosts();

    return newPost;
  },

  deletePost: (
    parent: unknown,
    { id }: { id: string },
    ctx: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { removed: deletedPost } = removeById(ctx.posts, id);
    if (!deletedPost) {
      throw new GraphQLError("Post does not exist.", {
        extensions: { code: "BAD_USER_INPUT", http: { status: 400 } },
        path: ["deletePost"],
      });
    }

    if (deletedPost.published) {
      ctx.pubsub.publish("POST", {
        post: {
          mutation: "DELETED",
          data: deletedPost,
        },
      });
    }

    // remove related comments
    ctx.comments = ctx.comments.filter((c) => c.postId !== id);
    ctx.saveComments();

    ctx.savePosts();
    return deletedPost;
  },

  updatePost: (
    parent: unknown,
    {
      id,
      data,
    }: {
      id: string;
      data: { title?: string; body?: string; published?: boolean };
    },
    { posts, savePosts, pubsub }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const post = posts.find((post) => post.id === id);
    const originalPost = { ...post };
    if (!post) {
      throw new GraphQLError("Post does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["updatePost"],
      });
    }
    if (typeof data.title === "string") {
      post.title = data.title;
    }
    if (typeof data.body === "string") {
      post.body = data.body;
    }
    if (typeof data.published === "boolean") {
      post.published = data.published;

      if (originalPost.published && !post.published) {
        // was published, now deleted
        pubsub.publish("POST", {
          post: {
            mutation: "DELETED",
            data: originalPost,
          },
        });
      } else if (!originalPost.published && post.published) {
        // was not published, now published
        pubsub.publish("POST", {
          post: {
            mutation: "CREATED",
            data: post,
          },
        });
      }
    } else if (post.published) {
      // updated a published post
      pubsub.publish("POST", {
        post: {
          mutation: "UPDATED",
          data: post,
        },
      });
    }
    const updatedPost = {
      ...post,
      ...data,
    };
    posts.splice(posts.indexOf(post), 1, updatedPost);
    savePosts();
    return updatedPost;
  },

  createComment: (
    parent: unknown,
    { data }: { data: createCommentArgs },
    { users, posts, comments, saveComments, pubsub }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { text, commentAuthorId, postId } = data;
    const commentAuthor = findById(users, commentAuthorId);
    if (!commentAuthor) {
      throw new GraphQLError("Comment author does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["createComment"],
      });
    }
    const post = findById(posts, postId);
    if (!post || !post.published) {
      throw new GraphQLError("Post does not exist or is not published.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["createComment"],
      });
    }
    const newComment = {
      id: v4(),
      text,
      commentAuthorId,
      postId,
    };
    comments.push(newComment);

    saveComments();

    pubsub.publish(`COMMENT_${postId}`, {
      comment: {
        mutation: "CREATED",
        data: newComment,
      },
    });

    return newComment;
  },

  deleteComment: (
    parent: unknown,
    { id }: { id: string },
    ctx: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const { removed: deletedComment } = removeById(ctx.comments, id);
    if (!deletedComment) {
      throw new GraphQLError("Comment does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["deleteComment"],
      });
    }
    ctx.saveComments();
    ctx.pubsub.publish(`COMMENT_${deletedComment.postId}`, {
      comment: {
        mutation: "DELETED",
        data: deletedComment,
      },
    });
    return deletedComment;
  },

  updateComment: (
    parent: unknown,
    {
      id,
      data,
    }: {
      id: string;
      data: { text?: string; commentAuthorId?: string; postId?: string };
    },
    { users, posts, comments, saveComments, pubsub }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    const comment = comments.find((comment) => comment.id === id);
    if (!comment) {
      throw new GraphQLError("Comment does not exist.", {
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
        path: ["updateComment"],
      });
    }
    if (typeof data.text === "string") {
      comment.text = data.text;
      pubsub.publish(`COMMENT_${comment.postId}`, {
        comment: {
          mutation: "UPDATED",
          data: comment,
        },
      });
    }
    if (typeof data.commentAuthorId === "string") {
      const commentAuthor = users.find(
        (user) => user.id === data.commentAuthorId
      );
      if (!commentAuthor) {
        throw new GraphQLError("Comment author does not exist.", {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
          path: ["updateComment"],
        });
      }
      comment.commentAuthorId = data.commentAuthorId;
    }
    if (typeof data.postId === "string") {
      const post = posts.find((post) => post.id === data.postId);
      if (!post || !post.published) {
        throw new GraphQLError("Post does not exist or is not published.", {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
          path: ["updateComment"],
        });
      }
      comment.postId = data.postId;
    }
    const updatedComment = {
      ...comment,
      ...data,
    };
    comments.splice(comments.indexOf(comment), 1, updatedComment);
    saveComments();
    return updatedComment;
  },
};
export default Mutation;
