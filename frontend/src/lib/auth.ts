import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE } from "./config";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(
            `${API_BASE}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) return null;

          const data = await res.json();

          // Return ONLY if token exists
          if (data?.token) {
            return {
              id: String(data.id ?? data.userId ?? 1),
              name: data.username ?? credentials.username,
              email: data.email ?? "",
              username: data.username ?? credentials.username,
              firstName: data.firstName ?? "",
              lastName: data.lastName ?? "",
              role: data.role ?? data.userRole ?? data.roleName ?? "",
              status: data.status ?? "ACTIVE",
              token: data.token,
              accessToken: data.token,
              tokenType: data.tokenType ?? "Bearer",
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken ?? (user as any).token;
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // Map JWT token fields onto session.user
      // We have to cast since our standard NextAuth types won't include all
      if (session?.user) {
        (session.user as any).accessToken = token.accessToken as string;
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
        (session.user as any).name = token.name as string;
        (session.user as any).email = token.email as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
