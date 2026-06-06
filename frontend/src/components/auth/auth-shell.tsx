import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background overflow-hidden">
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
              <h1 className="text-2xl font-semibold tracking-tight text-gradient">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            </div>
            {children}
          </div>

          {footer}

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            By continuing you agree to our{" "}
            <a className="underline hover:text-foreground" href="#">
              Terms
            </a>{" "}
            &{" "}
            <a className="underline hover:text-foreground" href="#">
              Privacy
            </a>
            .
          </p>
        </motion.div>
      </div>

      <AuthMarketingPanel />
    </div>
  );
}

function AuthMarketingPanel() {
  return (
    <div className="relative hidden lg:flex items-center justify-center overflow-hidden border-l border-border/40">
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.18 280 / 0.55), transparent 70%)",
        }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-20 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.18 230 / 0.5), transparent 70%)",
        }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-1/3 h-[320px] w-[320px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.2 340 / 0.35), transparent 70%)",
        }}
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
            "Pulse SMS has cut our delivery latency in half and gave us the clearest analytics we've
            ever had. It just feels premium."
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
  );
}
