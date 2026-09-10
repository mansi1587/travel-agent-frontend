import { useEffect } from 'react'
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom'

import { setUnauthorizedHandler } from '@/api/axiosClient'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { WelcomePage } from '@/pages/WelcomePage'

/**
 * Lets the axios interceptor redirect on a 401.
 *
 * The interceptor is plain module code with no access to router hooks, so it is
 * handed a callback from inside the router instead.
 */
function UnauthorizedRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    setUnauthorizedHandler(() => navigate('/login', { replace: true }))
  }, [navigate])

  return null
}

export function AppRouter() {
  return (
    <Router>
      <UnauthorizedRedirect />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<WelcomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
