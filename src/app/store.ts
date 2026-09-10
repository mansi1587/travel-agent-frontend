import { configureStore } from '@reduxjs/toolkit'

import { baseApi } from '@/api/baseApi'
import { chatUiReducer } from '@/features/chat/chatUiSlice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    chatUi: chatUiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    // RTK Query's middleware powers caching, invalidation and refetching. Without
    // it the hooks would fetch but never update on invalidateTags.
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
