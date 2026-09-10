import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/**
 * The only hand-written slice in the app.
 *
 * Everything that comes from the server lives in RTK Query's cache. What is left is
 * genuine UI state — things the server has no opinion about.
 */
interface ChatUiState {
  isPanelOpen: boolean
  /** null until the first answer of a new conversation comes back with its id. */
  activeConversationId: string | null
}

const initialState: ChatUiState = {
  isPanelOpen: false,
  activeConversationId: null,
}

const chatUiSlice = createSlice({
  name: 'chatUi',
  initialState,
  reducers: {
    panelToggled(state) {
      state.isPanelOpen = !state.isPanelOpen
    },
    panelClosed(state) {
      state.isPanelOpen = false
    },
    conversationOpened(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload
      state.isPanelOpen = true
    },
    /** Start a new conversation: the next question is sent without an id. */
    conversationCleared(state) {
      state.activeConversationId = null
    },
  },
})

export const {
  panelToggled,
  panelClosed,
  conversationOpened,
  conversationCleared,
} = chatUiSlice.actions

export const chatUiReducer = chatUiSlice.reducer
