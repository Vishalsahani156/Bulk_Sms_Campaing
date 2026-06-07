import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { redirectIfAuthenticated } from "@/lib/auth";
import { register as apiRegister } from "@/lib/api/auth.api";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => redirectIfAuthenticated({ search }),
  head: () => ({
    meta: [
      { title: "Create account — Pulse SMS" },
      { name: "description", content: "Create your Pulse SMS account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRegister({ email, password, name: email.split("@")[0] });
      refreshSession();
      toast.success("Account created — welcome to Pulse SMS!");
      navigate({ to: redirect ?? "/" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start sending bulk SMS campaigns in minutes."
      footer={
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect }}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthForm
        mode="signup"
        loading={loading}
        submitLabel="Create account"
        email={email}
        password={password}
        showPassword={showPassword}
        remember={false}
        showRemember={false}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword((s) => !s)}
        onRememberChange={() => {}}
        onSubmit={handleSubmit}
        oauthOnSuccess={() => {
          refreshSession();
          toast.success("Signed in");
          navigate({ to: redirect ?? "/" });
        }}
        oauthOnError={(message) => toast.error(message)}
      />
    </AuthShell>
  );
}
