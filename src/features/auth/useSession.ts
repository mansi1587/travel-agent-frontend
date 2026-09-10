import { useMeQuery } from '@/api/authApi'
import type { User } from '@/types/api'

interface Session {
  user: User | undefined
  isAuthenticated: boolean
  /** True while the cookie is still being checked — not the same as logged out. */
  isChecking: boolean
}

/**
 * Whether anyone is logged in.
 *
 * Auth is an httpOnly cookie, so JavaScript cannot read it. The only way to know is
 * to ask the server, which is why a page refresh always begins with this request.
 */
export function useSession(): Session {
  const { data, isLoading, isFetching, isError } = useMeQuery()

  // RTK Query keeps the last successful `data` when a later fetch fails. After a
  // logout the refetch of /auth/me returns 401, but `data` would still hold the old
  // user — leaving the UI convinced the session is alive while every request 401s.
  // An error here means exactly one thing: nobody is logged in.
  const user = isError ? undefined : data

  return {
    user,
    isAuthenticated: user !== undefined,
    // isLoading only covers the very first request; the second clause also covers a
    // refetch that has not resolved yet and has no earlier user to fall back on.
    isChecking: isLoading || (isFetching && data === undefined && !isError),
  }
}
