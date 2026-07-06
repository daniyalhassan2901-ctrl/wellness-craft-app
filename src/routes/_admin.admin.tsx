import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/_admin/admin")({
  component: AdminSectionLayout,
});

function AdminSectionLayout() {
  return (
    <ErrorBoundary label="Admin section failed to load">
      <Outlet />
    </ErrorBoundary>
  );
}
