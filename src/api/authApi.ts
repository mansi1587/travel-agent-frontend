import { baseApi } from '@/api/baseApi'
import type { LoginRequest, RegisterRequest, User } from '@/types/api'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Who is logged in, according to the cookie the browser holds.
     *
     * This is what makes a session survive a page refresh: there is no token in
     * JavaScript to inspect, so the only way to know is to ask the server.
     */
    me: builder.query<User, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['User'],
    }),

    login: builder.mutation<User, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
      // Conversations belong to a user, so a different user must not see the
      // previous one's cached list.
      invalidatesTags: ['User', 'Conversation'],
    }),

    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', data: body }),
      invalidatesTags: ['User', 'Conversation'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        // Wipe the whole cache rather than invalidating tags. Invalidating would
        // refetch /auth/me and the conversation list as the logged-out user, and
        // would leave the previous person's conversations sitting in memory for
        // whoever logs in next.
        dispatch(baseApi.util.resetApiState())
      },
    }),
  }),
})

export const {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi
