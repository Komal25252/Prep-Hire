import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware uses the Edge-safe config only (no mongoose/bcrypt)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
