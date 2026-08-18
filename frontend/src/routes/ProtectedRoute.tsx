import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { EmptyState } from '../components/ui/Feedback';
import { useAuthStore } from '../state/authStore';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export function RequirePermission({
  permission,
  anyOf,
  children,
}: {
  permission?: string;
  anyOf?: string[];
  children: React.ReactNode;
}) {
  const check = useAuthStore((s) => s.hasPermission);
  const allowed = anyOf?.length
    ? anyOf.some((p) => check(p))
    : permission
      ? check(permission)
      : false;
  if (!allowed) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <EmptyState
          title="You don't have access to this screen"
          description="This area requires a permission your current role doesn't include. Contact your institution administrator if you believe this is a mistake."
        />
      </div>
    );
  }
  return <>{children}</>;
}
