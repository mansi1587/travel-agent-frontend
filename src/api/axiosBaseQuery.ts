import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig } from 'axios'

import { axiosClient } from '@/api/axiosClient'
import type { ApiError } from '@/types/api'

export interface AxiosBaseQueryArgs {
  url: string
  method?: AxiosRequestConfig['method']
  data?: unknown
  params?: AxiosRequestConfig['params']
}

/**
 * Lets RTK Query run on our axios instance instead of its built-in fetch.
 *
 * Without this, RTK Query would bypass the interceptors — meaning no shared
 * `withCredentials`, and no single place turning `{"detail": ...}` into an ApiError.
 */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiError> =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await axiosClient({ url, method, data, params })
      return { data: result.data }
    } catch (error) {
      // The response interceptor has already normalised this into an ApiError.
      return { error: error as ApiError }
    }
  }
