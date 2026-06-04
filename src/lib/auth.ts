import { redirect } from "@tanstack/react-router";
import { getAccessToken, clearAccessToken } from "@/lib/api/client";
import { getMe, logout as apiLogout } from "@/lib/api/auth.api";
import type { ApiUser } from "@/lib/api/auth.api";

export interface AuthSession {
  user: ApiUser;
  accessToken: string;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const user = await getMe();
    return { user, accessToken: token };
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function requireAuth({ location }: { location: { pathname: string; href: string } }) {
  const session = await getAuthSession();
  if (!session) {
    throw redirect({
      to: "/login",
      search: { redirect: location.pathname },
    });
  }
  return { session };
}

export async function redirectIfAuthenticated({ search }: { search: { redirect?: string } }) {
  const session = await getAuthSession();
  if (session) {
    const to =
      search.redirect && search.redirect !== "/login" && search.redirect !== "/register"
        ? search.redirect
        : "/";
    throw redirect({ to });
  }
}

export async function signOutUser() {
  await apiLogout();
}

import type { ApiUser } from "@/lib/api/auth.api";

export function getUserDisplayName(user: ApiUser | null): string {
  if (!user) return "Guest";
  if (user.name) return user.name;
  return user.email?.split("@")[0] ?? "User";
}

export function getUserInitials(user: ApiUser | null): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
