import { baseApi } from '@/api/baseApi'
import type {
  AskRequest,
  AskResponse,
  Conversation,
  ConversationDetail,
} from '@/types/api'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ask: builder.mutation<AskResponse, AskRequest>({
      query: (body) => ({ url: '/chat/ask', method: 'POST', data: body }),
      // A question either creates a conversation or bumps its last_message_at, so the
      // sidebar's ordering is stale either way.
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),

    conversations: builder.query<Conversation[], void>({
      query: () => ({ url: '/chat/conversations' }),
      providesTags: (result) => [
        { type: 'Conversation' as const, id: 'LIST' },
        ...(result ?? []).map(({ id }) => ({ type: 'Conversation' as const, id })),
      ],
    }),

    conversation: builder.query<ConversationDetail, string>({
      query: (id) => ({ url: `/chat/conversations/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Conversation', id }],
    }),

    deleteConversation: builder.mutation<void, string>({
      query: (id) => ({ url: `/chat/conversations/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Conversation', id },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useAskMutation,
  useConversationsQuery,
  useConversationQuery,
  useDeleteConversationMutation,
} = chatApi
