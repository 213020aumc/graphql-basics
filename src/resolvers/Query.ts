import { GraphQLError, GraphQLResolveInfo } from "graphql";
import {
  GreetingArgs,
  UserArgs,
  AddArgs,
  ResolverContext,
  PostArgs,
} from "../types/resolverTypes";
import { grades } from "../types/grades.js";

export const Query = {
  greeting: (
    parent: unknown,
    { name }: GreetingArgs,
    { users }: ResolverContext,
    info: GraphQLResolveInfo
  ) => `Hello${name ? ` ${name}` : ""}!`,
  hello: () => `This is my first GraphQL API`,
  name: () => "Muhammad Fraz",
  location: () => "Lahore, Punjab, Pakistan",
  bio: () => "Software Engineer: Learning GraphQL",

  users: (
    parent: unknown,
    args: UserArgs,
    { users }: ResolverContext,
    info: GraphQLResolveInfo
  ) =>
    args.query
      ? users.filter((user) =>
          user.name.toLowerCase().includes(args.query!.toLowerCase())
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
    { posts }: ResolverContext,
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
    { users }: ResolverContext,
    info: GraphQLResolveInfo
  ) => {
    return number.reduce((acc: number, curr: number) => acc + curr, 0);
  },

  comments: (parent: unknown, args: unknown, { comments }: ResolverContext) => {
    return comments;
  },
};
