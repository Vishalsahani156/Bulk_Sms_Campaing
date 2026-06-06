import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { redirectIfAuthenticated } from "@/lib/auth";
import { login as apiLogin, forgotPassword } from "@/lib/api/auth.api";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => redirectIfAuthenticated({ search }),
  head: () => ({
    meta: [
      { title: "Sign in — Pulse SMS" },
      { name: "description", content: "Access your Pulse SMS dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const goAfterAuth = () => {
    refreshSession();
    navigate({ to: redirect ?? "/" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiLogin({ email, password });
      toast.success("Welcome back!");
      goAfterAuth();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign-in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setResetLoading(true);
    try {
      await forgotPassword(email);
      toast.info("If an account exists, a reset link will be sent.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Pulse SMS account."
      footer={
        <p className="text-center text-xs text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            search={{ redirect }}
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <AuthForm
        mode="signin"
        loading={loading}
        submitLabel="Sign in"
        email={email}
        password={password}
        showPassword={showPassword}
        remember={remember}
        showRemember
        useMockOAuth={false}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword((s) => !s)}
        onRememberChange={setRemember}
        onSubmit={handleSubmit}
        oauthOnSuccess={() => {
          refreshSession();
          toast.success("Signed in");
          goAfterAuth();
        }}
        oauthOnError={(message) => toast.error(message)}
        forgotPasswordSlot={
          <button
            type="button"
            disabled={resetLoading}
            onClick={handleForgotPassword}
            className="text-[11px] text-primary hover:underline disabled:opacity-50"
          >
            {resetLoading ? "Sending…" : "Forgot password?"}
          </button>
        }
      />
    </AuthShell>
  );
}
