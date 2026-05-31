import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Sign-in failed. Please try again.");
        setOauthLoading(null);
        return;
      }
      if (!result.redirected) {
        toast.success("Signed in successfully");
        navigate({ to: "/" });
      }
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background overflow-hidden">
      {/* LEFT — form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Pulse SMS</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Enterprise
              </p>
            </div>
          </Link>

          <div className="glass-strong rounded-2xl p-7 sm:p-8 shadow-elevated">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-gradient">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {mode === "signin"
                  ? "Sign in to manage your campaigns."
                  : "Start sending in under a minute."}
              </p>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <SocialButton
                provider="google"
                loading={oauthLoading === "google"}
                onClick={() => handleOAuth("google")}
              />
              <SocialButton
                provider="apple"
                loading={oauthLoading === "apple"}
                onClick={() => handleOAuth("apple")}
              />
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card/60 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 bg-background/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-11 bg-background/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "signin" && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                  />
                  Keep me signed in for 30 days
                </label>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gradient-primary text-primary-foreground hover:opacity-90 shadow-glow transition-all hover:shadow-[0_0_60px_-5px_oklch(0.72_0.18_280/0.6)]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign in" : "Create account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary font-medium hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            By continuing you agree to our{" "}
            <a className="underline hover:text-foreground" href="#">Terms</a> &{" "}
            <a className="underline hover:text-foreground" href="#">Privacy</a>.
          </p>
        </motion.div>
      </div>

      {/* RIGHT — animated marketing panel */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden border-l border-border/40">
        {/* Animated gradient orbs */}
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 280 / 0.55), transparent 70%)" }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.18 230 / 0.5), transparent 70%)" }}
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/3 left-1/3 h-[320px] w-[320px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.2 340 / 0.35), transparent 70%)" }}
          animate={{ x: [0, 40, -20, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-0 grid-bg opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10 max-w-md px-10"
        >
          <div className="glass rounded-2xl p-7 shadow-elevated">
            <div className="flex items-center gap-1.5 mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="h-1 w-6 rounded-full bg-primary/70" />
              ))}
            </div>
            <p className="text-lg leading-relaxed font-medium tracking-tight">
              "Pulse SMS has cut our delivery latency in half and gave us the
              clearest analytics we've ever had. It just feels premium."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                MR
              </div>
              <div>
                <p className="text-sm font-medium">Maya Rodriguez</p>
                <p className="text-xs text-muted-foreground">VP Growth · Northwind</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Delivery", value: "99.2%" },
              { label: "Avg latency", value: "1.4s" },
              { label: "Sent / mo", value: "82M" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className="text-base font-semibold text-gradient">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SocialButton({
  provider,
  loading,
  onClick,
}: {
  provider: "google" | "apple";
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={onClick}
      className="h-11 bg-background/40 border-border/60 hover:bg-accent/60 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : provider === "google" ? (
        <>
          <GoogleIcon />
          <span className="text-sm">Google</span>
        </>
      ) : (
        <>
          <AppleIcon />
          <span className="text-sm">Apple</span>
        </>
      )}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.4 1.4c0 1.1-.4 2.2-1.2 3-.8.8-1.9 1.4-3 1.3-.1-1.1.4-2.2 1.2-3 .8-.8 2-1.3 3-1.3zM20 17.3c-.6 1.3-.9 1.9-1.6 3-1 1.6-2.5 3.5-4.3 3.6-1.6 0-2-1.1-4.2-1.1s-2.7 1.1-4.2 1.1c-1.8 0-3.2-1.8-4.2-3.4-2.8-4.5-3.1-9.8-1.4-12.6 1.2-2 3.2-3.2 5-3.2 1.9 0 3.1 1.1 4.7 1.1 1.5 0 2.5-1.1 4.7-1.1 1.7 0 3.4.9 4.6 2.5-4 2.2-3.4 8 1 9.1z" />
    </svg>
  );
}
