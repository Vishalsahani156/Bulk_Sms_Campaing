import type { Session } from "@supabase/supabase-js";

/** Demo/testing auth — credentials are not verified or persisted as secrets. */
export const MOCK_AUTH_STORAGE_KEY = "pulse_sms_mock_user";
export const MOCK_AUTH_CHANGE_EVENT = "pulse_sms_mock_auth_change";

export type MockUser = {
  email: string;
  displayName?: string;
};

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOCK_AUTH_CHANGE_EVENT));
  }
}

export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

/** Persists display info only — password is never stored. */
export function setMockUser(user: MockUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function clearMockUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  notifyAuthChange();
}

export function mockSignIn(email: string, _password: string) {
  const trimmed = email.trim();
  if (!trimmed) throw new Error("Email is required");
  if (!trimmed.includes("@")) throw new Error("Enter a valid email address");
  setMockUser({
    email: trimmed,
    displayName: trimmed.split("@")[0] || "User",
  });
}

export function mockRegister(email: string, password: string) {
  mockSignIn(email, password);
}

export function mockOAuthSignIn(provider: "google" | "apple") {
  setMockUser({
    email: `demo-${provider}@pulse.test`,
    displayName: provider === "google" ? "Demo Google" : "Demo Apple",
  });
}

export function mockForgotPassword(_email: string) {
  // Demo only — no email is sent
}

export function mockUserToSession(user: MockUser | null): Session | null {
  if (!user) return null;
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 86400,
    expires_at: now + 86400,
    token_type: "bearer",
    user: {
      id: "mock-user-id",
      email: user.email,
      app_metadata: {},
      user_metadata: { name: user.displayName },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  } as Session;
}
