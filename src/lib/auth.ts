import { redirect } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { clearMockUser, getMockUser, mockUserToSession } from "@/lib/mock-auth";

export async function getAuthSession() {
  return mockUserToSession(getMockUser());
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
  clearMockUser();
}

export function getUserDisplayName(session: Session | null): string {
  if (!session?.user) return "Guest";
  const meta = session.user.user_metadata;
  if (meta?.full_name) return String(meta.full_name);
  if (meta?.name) return String(meta.name);
  return session.user.email?.split("@")[0] ?? "User";
}

export function getUserInitials(session: Session | null): string {
  const name = getUserDisplayName(session);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
