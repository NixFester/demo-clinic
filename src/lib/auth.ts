import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { callBridge } from "./bridge";

interface BridgeUser {
  id: number;
  nama_lengkap: string;
  username: string;
  role: "superadmin" | "admin" | "dokter" | "karyawan" | "kasir";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
    };
  }
  interface User {
    id: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.warn("[Auth] Missing username or password");
          return null;
        }

        try {
          const user = await callBridge<BridgeUser>("auth.findByUsername", {
            username: credentials.username,
            password: credentials.password,
          });

          console.log(`[Auth] Login success: ${user.username} (${user.role})`);
          return {
            id: String(user.id),
            name: user.nama_lengkap,
            role: user.role,
          };
        } catch (error: unknown) {
          console.error("[Auth] Login failed:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
