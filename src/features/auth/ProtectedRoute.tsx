import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullPageSpinner } from '@/components/ui/Spinner'
import { useSession } from '@/features/auth/useSession'

export function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useSession()
  const location = useLocation()

  // Crucial that this comes first. Redirecting while the check is still running
  // would bounce a logged-in user to the login page on every refresh.
  if (isChecking) return <FullPageSpinner />

  if (!isAuthenticated) {
    // Remember where they were headed, so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

/** The mirror image: keeps a logged-in user off the login and register pages. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isChecking } = useSession()

  if (isChecking) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}
