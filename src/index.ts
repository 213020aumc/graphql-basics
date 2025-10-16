// src/index.ts
import { GraphQLError } from "graphql";
import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 } from "uuid";
import rawUsers from "./data/users.json" with { type: "json" };
import rawPosts from "./data/posts.json" with { type: "json" };
import rawComments from "./data/comments.json" with { type: "json" };
import { grades } from "./types/grades.js";

import {
  GreetingArgs,
  UserArgs,
  AddArgs,
  ResolverContext,
  PostArgs,
  createUserArgs,
  createPostArgs,
  createCommentArgs,
} from "./types/resolverTypes";
import { GraphQLResolveInfo } from "graphql";

import { User } from "./types/user";
import { Post } from "./types/post";
import { Comment } from "./types/comment";

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
// console.log("Full URL of the current module file: ", __filename);

const __dirname = path.dirname(__filename);

// console.log("Extracts the folder path from the file path: ", __dirname);

const usersFilePath = path.join(__dirname, "data", "users.json");
const postsFilePath = path.join(__dirname, "data", "posts.json");
const commentsFilePath = path.join(__dirname, "data", "comments.json");

// console.log("Joining the folder path with data and users.json", usersFilePath);

if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 4));
}

/*Scalar Types: String, Int, Float, Boolean, ID 
Scalar is just a single value. It stores a single value of a specific type.
*/

const users: User[] = [...rawUsers];
const posts: Post[] = rawPosts;
const comments: Comment[] = rawComments;

const typeDefs = /* GraphQL */ `
  type Query {
    greeting(name: String): String!
    hello: String!
    name: String!
    location: String!
    bio: String!
    users(query: String): [User!]!
    me: User!
    posts(query: String): [Post!]!
    comments: [Comment!]!
    grades: [Int]!
    add(number: [Float!]!): Float!
  }

  type Mutation {
    createUser(name: String!, email: String!, age: Int): User!
    createPost(
      title: String!
      body: String!
      published: Boolean!
      authorId: ID!
    ): Post!
    createComment(text: String!, commentAuthorId: ID!, postId: ID!): Comment!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!
    comments: [Comment!]!
  }

  type Post {
    id: ID!
    title: String!
    body: String!
    published: Boolean
    author: User!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    text: String!
    commentAuthor: User!
    post: Post!
  }
`;

const resolvers = {
  Mutation: {
    createUser: (
      parent: unknown,
      { name, email, age }: createUserArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const emailTaken = users.some((user) => user.email === email);
      if (emailTaken) {
        throw new GraphQLError("User with Email already taken.", {
          extensions: {
            code: "BAD_USER_INPUT", // or "EMAIL_ALREADY_EXISTS"
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
      console.log("New User Created: ", newUser);

      users.push(newUser);
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 4));

      return newUser;
    },

    createPost: (
      parent: unknown,
      { title, body, published, authorId }: createPostArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const author = users.find((user) => user.id === authorId);
      if (!author) {
        throw new GraphQLError("User does not exist.", {
          extensions: {
            code: "BAD_USER_INPUT", // or "USER_DOES_NOT_EXIST"
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
      // console.log("New Post Created: ", newPost);

      posts.push(newPost);
      fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 4));

      return newPost;
    },

    createComment: (
      parent: unknown,
      { text, commentAuthorId, postId }: createCommentArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      const commentAuthor = users.find((user) => user.id === commentAuthorId);
      if (!commentAuthor) {
        throw new GraphQLError("Comment author does not exist.", {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
          path: ["createComment"],
        });
      }

      const post = posts.find((post) => post.id === postId);

      // console.log("Is Published: ", post.published);

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
      fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 4));
      return newComment;
    },
  },

  Query: {
    greeting: (
      parent: unknown,
      { name }: GreetingArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => `Hello${name ? ` ${name}` : ""}!`,
    hello: () => `This is my first GraphQL API`,
    name: () => "Muhammad Fraz",
    location: () => "Lahore, Punjab, Pakistan",
    bio: () => "Software Engineer: Learning GraphQL",

    users: (
      parent: unknown,
      args: UserArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) =>
      args.query
        ? users.filter((user) =>
            user.name.toLowerCase().includes(args.query.toLowerCase())
          )
        : users,

    me: () => {
      return {
        id: "1",
        name: "Muhammad Fraz",
        email: "fraz@example.com",
        age: 23,
      };
    },

    posts: (
      parent: unknown,
      args: PostArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      if (args.query) {
        return posts.filter(
          (post) =>
            post.title.toLowerCase().includes(args.query.toLowerCase()) ||
            post.body.toLowerCase().includes(args.query.toLowerCase())
        );
      }
      return posts;
    },

    grades: () => {
      return grades.filter((grade) => grade > 50);
    },

    add: (
      parent: unknown,
      { number }: AddArgs,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return number.reduce((acc: number, curr: number) => acc + curr, 0);
    },

    comments: () => {
      return comments;
    },
  },

  //This is a type-level resolver (also known as a field resolver or object resolver) for the type.
  Post: {
    author: (
      parent: Post,
      args: unknown,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return users.find((user) => user.id === parent.authorId) || null;
    },

    comments: (
      parent: Post,
      args: unknown,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return comments.filter((comment) => comment.postId === parent.id) || null;
    },
  },

  User: {
    posts: (
      parent: User,
      args: unknown,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return posts.filter((post) => parent.postIds.includes(post.id));
    },

    comments: (
      parent: User,
      args: unknown,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return comments.filter(
        (comment) => comment.commentAuthorId === parent.id
      );
    },
  },

  Comment: {
    commentAuthor: (
      parent: Comment,
      args: unknown,
      ctx: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return users.find((user) => user.id === parent.commentAuthorId) || null;
    },
    post: (parent: Comment) => {
      return posts.find((post) => post.id === parent.postId) || null;
    },
  },
};

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
});

const server = createServer(yoga);
server.listen(4000, () => {
  console.log("🚀 Server is running on http://localhost:4000/graphql");
});
