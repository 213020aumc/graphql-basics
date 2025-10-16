// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  postIds: string[];
}
