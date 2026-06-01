import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => requireAuth({ location }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
