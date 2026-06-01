import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthSession, signOutUser } from "@/lib/auth";
import { MOCK_AUTH_CHANGE_EVENT } from "@/lib/mock-auth";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(() => {
    void getAuthSession().then((next) => {
      setSession(next);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    refreshSession();

    const onAuthChange = () => refreshSession();
    window.addEventListener(MOCK_AUTH_CHANGE_EVENT, onAuthChange);
    return () => window.removeEventListener(MOCK_AUTH_CHANGE_EVENT, onAuthChange);
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signOut,
      refreshSession,
    }),
    [session, isLoading, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
