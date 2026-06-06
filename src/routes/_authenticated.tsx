import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAuth } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => requireAuth({ location }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [isLoading, session, navigate, pathname]);

  if (isLoading || !session) {
    return <DashboardSkeleton />;
  }

  return <Outlet />;
}
