import { createApi } from '@reduxjs/toolkit/query/react'

import { axiosBaseQuery } from '@/api/axiosBaseQuery'

/**
 * One API slice, extended by authApi and chatApi.
 *
 * Splitting into separate createApi calls would give each its own cache, so a login
 * could not invalidate conversations. Sharing tags keeps that coordination possible.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User', 'Conversation'],
  endpoints: () => ({}),
})
