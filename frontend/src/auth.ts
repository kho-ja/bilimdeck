/**
 * NextAuth.js configuration
 *
 * This file configures authentication using NextAuth with Django JWT backend.
 * - Uses Credentials provider to authenticate against Django /api/token/ endpoint
 * - Stores JWT access and refresh tokens in the session
 * - Fetches user info from /api/auth/me/ after successful login
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const decodeJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4 || 4)) % 4),
      "=",
    );
    let json = "";
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(padded, "base64").toString("utf-8");
    } else if (typeof atob !== "undefined") {
      json = decodeURIComponent(escape(atob(padded)));
    } else {
      return null;
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const refreshAccessToken = async (refreshToken?: string) => {
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    const tokens = await res.json();
    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    };
  } catch {
    return null;
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          // Step 1: Authenticate with Django and get JWT tokens
          const res = await fetch(`${apiBaseUrl}/token/`, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            return null;
          }

          const tokens = await res.json();

          // Step 2: Fetch user info using the access token
          const meRes = await fetch(`${apiBaseUrl}/auth/me/`, {
            headers: { Authorization: `Bearer ${tokens.access}` },
          });

          if (!meRes.ok) return null;

          const user = await meRes.json();

          // Step 3: Return user object with tokens attached
          return {
            ...user,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.username = user.username;
      }

      const accessToken = token.accessToken as string | undefined;
      const refreshToken = token.refreshToken as string | undefined;

      if (accessToken && refreshToken) {
        const payload = decodeJwt(accessToken);
        const exp = payload?.exp as number | undefined;
        const now = Math.floor(Date.now() / 1000);

        if (!exp || exp - 30 <= now) {
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed?.accessToken) {
            token.accessToken = refreshed.accessToken;
            token.refreshToken = refreshed.refreshToken || refreshToken;
          } else {
            token.accessToken = undefined;
            token.refreshToken = undefined;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
        (session as any).user.username = token.username;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth;

      // Extract locale from pathname or default to 'en'
      // This regex matches /en, /uz, /ja at the start of the path
      const localeMatch = pathname.match(/^\/(en|uz|ja)(\/|$)/);
      const locale = localeMatch ? localeMatch[1] : "en"; // Default to 'en' if no locale found

      // Check if we are on an auth page (e.g., /en/login, /login, /en/register)
      const isAuthPage =
        pathname.includes("/login") || pathname.includes("/register");

      // Check if we are on a protected route
      const isProtectedRoute =
        pathname.includes("/dashboard") ||
        pathname.includes("/app") ||
        pathname.includes("/decks");

      // Helper to construct localized URL respecting 'as-needed' strategy
      // We assume 'en' is default and 'as-needed' is used, so we don't prefix 'en'
      // Ideally we should import this logic, but for now we hardcode the check to avoid complex imports in edge runtime if strictly needed
      // However, importing routing is better.
      const isDefaultLocale = locale === "en";
      const localePrefix = isDefaultLocale ? "" : `/${locale}`;

      if (isAuthPage) {
        if (isLoggedIn) {
          // If logged in and on login page, redirect to dashboard with correct locale
          return Response.redirect(
            new URL(`${localePrefix}/dashboard`, request.nextUrl),
          );
        }
        return true; // Allow access to login page if not logged in
      }

      if (isProtectedRoute) {
        if (!isLoggedIn) {
          // If not logged in and on protected route, redirect to login with correct locale
          const signInUrl = new URL(`${localePrefix}/login`, request.nextUrl);
          signInUrl.searchParams.set(
            "returnTo",
            request.nextUrl.pathname + request.nextUrl.search,
          );
          return Response.redirect(signInUrl);
        }
        return true; // Allow access if logged in
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});
