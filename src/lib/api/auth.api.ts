import { apiRequest, setAccessToken, clearAccessToken } from "./client";

export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  expiresIn: number;
}

export async function register(input: { email: string; password: string; name?: string }) {
  const data = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const data = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

export async function getMe() {
  return apiRequest<ApiUser>("/users/me");
}

export async function forgotPassword(email: string) {
  return apiRequest<{ ok: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}
