import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config — no Node.js modules here
export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: { signIn: "/" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith("/interview")) {
        return isLoggedIn;
      }
      return true;
    },
  },
};
