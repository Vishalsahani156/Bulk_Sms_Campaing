import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { lovable } from "@/integrations/lovable";

export function OAuthButtons({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        onError("Sign-in failed. Please try again.");
        setOauthLoading(null);
        return;
      }
      if (!result.redirected) {
        onSuccess();
      }
    } catch {
      onError("Sign-in failed. Please try again.");
      setOauthLoading(null);
    }
  };

  return (
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
  );
}

export function EmailPasswordFields({
  mode,
  email,
  password,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  forgotPasswordSlot,
}: {
  mode: "signin" | "signup";
  email: string;
  password: string;
  showPassword: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  forgotPasswordSlot?: ReactNode;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="pl-9 h-11 bg-background/40"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs">
            Password
          </Label>
          {mode === "signin" && forgotPasswordSlot}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pl-9 pr-9 h-11 bg-background/40"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}

export function AuthSubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-11 gradient-primary text-primary-foreground hover:opacity-90 shadow-glow transition-all hover:shadow-[0_0_60px_-5px_oklch(0.72_0.18_280/0.6)]"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export function RememberMeCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
      Keep me signed in for 30 days
    </label>
  );
}

export function AuthForm({
  mode,
  loading,
  submitLabel,
  email,
  password,
  showPassword,
  remember,
  showRemember,
  forgotPasswordSlot,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberChange,
  onSubmit,
  oauthOnSuccess,
  oauthOnError,
  children,
}: {
  mode: "signin" | "signup";
  loading: boolean;
  submitLabel: string;
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
  showRemember: boolean;
  forgotPasswordSlot?: ReactNode;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onRememberChange: (value: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  oauthOnSuccess: () => void;
  oauthOnError: (message: string) => void;
  children?: ReactNode;
}) {
  return (
    <>
      <OAuthButtons onSuccess={oauthOnSuccess} onError={oauthOnError} />

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

      <form onSubmit={onSubmit} className="space-y-4">
        <EmailPasswordFields
          mode={mode}
          email={email}
          password={password}
          showPassword={showPassword}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
          onTogglePassword={onTogglePassword}
          forgotPasswordSlot={forgotPasswordSlot}
        />

        {showRemember && (
          <RememberMeCheckbox checked={remember} onCheckedChange={onRememberChange} />
        )}

        <AuthSubmitButton loading={loading} label={submitLabel} />
      </form>

      {children}
    </>
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
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
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
