import type { DefaultSession, DefaultUser } from "next-auth";
import type { User } from "@/types";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string | null;
    status: string;
    token: string;
    accessToken: string;
    tokenType?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      role: string | null;
      status: string;
      name: string;
      email: string;
      accessToken: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    tokenType?: string;
    role: string | null;
    id: string;
    user?: User;
  }
}
