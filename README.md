# 📦 GraphQL API Starter

A comprehensive, beginner-friendly starter template for building a GraphQL API. This project is built with **[GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)**, **TypeScript**, and **Node.js**, demonstrating core GraphQL concepts with a simple, file-based data layer.

It's the perfect starting point for learning schema design, type-safe resolvers, mutations, and handling relationships in a modern GraphQL server.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Node.js](https://img.shields.io/badge/Node.js-22.x+-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## 📋 Table of Contents

- [📦 GraphQL API Starter](#-graphql-api-starter)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🛠️ Technology Stack](#️-technology-stack)
      - [Development \& Build Tools](#development--build-tools)
  - [📁 Project Structure](#-project-structure)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running in Development](#running-in-development)
    - [Running for Production](#running-for-production)
  - [📜 Available Scripts](#-available-scripts)
  - [🧪 API Usage \& Examples](#-api-usage--examples)
    - [1. Basic Queries](#1-basic-queries)
    - [2. Relational \& Filtered Queries](#2-relational--filtered-queries)
    - [3. Mutations](#3-mutations)
  - [📚 License](#-license)

---

## ✨ Features

- **Modern GraphQL Server**: Powered by the fast and flexible `graphql-yoga`.
- **Type-Safe by Design**: Leverages TypeScript for robust, error-free resolvers and types.
- **File-Based Persistence**: Uses simple JSON files to store data, making it easy to understand data flow.
- **Production-Ready Build Process**: Scripts for compiling TypeScript and running the optimized server.
- **Live Reloading for Development**: Uses `concurrently` and `nodemon` for an efficient development workflow.
- **Custom Error Handling**: Implements `GraphQLError` for clear, standardized client-side errors.

---

## 🛠️ Technology Stack

- **Server**: [Node.js](https://nodejs.org/)
- **GraphQL Engine**: [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Module System**: ES Modules (`"type": "module"`)

#### Development & Build Tools

- **Development Server**: `concurrently` & `nodemon` for running multiple processes and live-reloading.
- **TypeScript Compiler**: `tsc` for compiling TypeScript to JavaScript.
- **Build Utilities**: `rimraf` for cleaning directories and `cpy-cli` for copying non-TS files (like JSON data) to the build folder.

---

## 📁 Project Structure

```
graphql-basics/
├── 📁 dist/                    # Compiled JavaScript output (for production)
├── 📁 src/
│   |   ├──📁 data/             # JSON files acting as the database
│   |   ├── 📄 comments.json
│   |   ├── 📄 posts.json
│   |   ├── 📄 users.json
│   ├── 📁 types/               # TypeScript type and interface definitions
│   |   ├── 📄 comment.ts
│   |   ├── 📄 grades.ts
│   |   ├── 📄 post.ts
│   |   ├── 📄 resolverTypes.ts
│   |   └── 📄 user.ts
│   └── index.ts                # Main server entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to get the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v22.x or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/213020aumc/graphql-basics.git
    cd graphql-basics
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running in Development

To start the server in development mode with live reloading:

```bash
npm run server
```

This command uses `concurrently` to start three processes:

1.  The TypeScript compiler in watch mode (`tsc -w`).
2.  A watcher to copy your `.json` data files to the `dist` folder on change.
3.  `nodemon` to automatically restart the server whenever a file in the `dist` folder is updated.

The server will be running at **[http://localhost:4000/graphql](http://localhost:4000/graphql)**.

### Running for Production

To build and run the application for a production environment:

1.  **Build the project:**

    ```bash
    npm run build
    ```

    This command cleans the `dist` folder, compiles all TypeScript files to JavaScript, and copies the data files.

2.  **Start the server:**
    ```bash
    npm start
    ```
    This runs the compiled application from the `dist` folder.

---

## 📜 Available Scripts

- `npm run server`: Starts the development server with live-reloading.
- `npm run build`: Compiles the TypeScript project for production.
- `npm start`: Runs the compiled production build.
- `npm run clean`: Deletes the `dist` build directory.
- `npm run test`: (Placeholder) Runs tests.

---

## 🧪 API Usage & Examples

Here are several examples you can run in the GraphQL Playground to test the API's capabilities, from simple queries to complex mutations with relational data.

**Note:** For mutations, you may need to use valid `ID` values from your `src/data/*.json` files.

### 1. Basic Queries

These queries test simple, top-level fields.

**Get a personalized greeting:**

```graphql
query GetGreeting {
  greeting(name: "Muhammad")
}
```

**Get a list of all comments:**

```graphql
query GetAllComments {
  comments {
    id
    text
  }
}
```

### 2. Relational & Filtered Queries

These queries demonstrate the power of GraphQL to fetch nested data and filter results.

**Get all users and their associated posts:**

```graphql
query GetUsersWithPosts {
  users {
    id
    name
    posts {
      id
      title
      published
    }
  }
}
```

**Filter posts and fetch nested author and comment data:**
This query finds posts containing "GraphQL" in the title or body, and for each result, it retrieves the post's author, its comments, and the author of each comment.

```graphql
query GetFilteredPosts {
  posts(query: "GraphQL") {
    id
    title
    author {
      name
    }
    comments {
      text
      commentAuthor {
        name
      }
    }
  }
}
```

### 3. Mutations

These examples show how to create new data in the API.

**Create a new user:**
Notice the arguments are passed directly, not within a `data` object.

```graphql
mutation CreateNewUser {
  createUser(name: "Jane Doe", email: "jane.doe@example.com", age: 28) {
    id
    name
    email
    age
  }
}
```

**Create a new post for an existing user:**
You must provide a valid `authorId` from your `users.json` file.

```graphql
mutation CreateNewPost {
  createPost(
    title: "Advanced TypeScript"
    body: "Exploring advanced features in TS."
    published: true
    authorId: "1" # Replace with a valid user ID
  ) {
    id
    title
    published
    author {
      id
      name
    }
  }
}
```

**Create a new comment on an existing post:**
You must provide a valid `commentAuthorId` and `postId`.

```graphql
mutation CreateNewComment {
  createComment(
    text: "This is a really insightful post!"
    commentAuthorId: "2" # Replace with a valid user ID
    postId: "10" # Replace with a valid post ID
  ) {
    id
    text
    commentAuthor {
      name
    }
    post {
      title
    }
  }
}
```
## 📚 License

This project is licensed under the [MIT License](LICENSE).