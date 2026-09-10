import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const STORAGE_KEY = 'travel-agent:active-conversation'

/** The panel shows one of two screens, like a messaging widget. */
export type ChatView = 'list' | 'conversation'

interface ChatUiState {
  isPanelOpen: boolean
  view: ChatView
  /** null while a conversation is new — the backend mints the id on the first answer. */
  activeConversationId: string | null
}

function readStoredConversationId(): string | null {
  // Private browsing and some corporate policies make localStorage throw on access,
  // which would take the whole app down before it rendered.
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const storedId = readStoredConversationId()

const initialState: ChatUiState = {
  isPanelOpen: false,
  // Reopen where the user left off, but land on the list if there is nothing to resume.
  view: storedId ? 'conversation' : 'list',
  activeConversationId: storedId,
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
    /** Open an existing conversation from the list. */
    conversationOpened(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload
      state.view = 'conversation'
      state.isPanelOpen = true
    },
    /** Start a blank conversation: the next question is sent without an id. */
    newConversationStarted(state) {
      state.activeConversationId = null
      state.view = 'conversation'
      state.isPanelOpen = true
    },
    /**
     * Record the id the backend minted for a brand-new conversation.
     *
     * Separate from `conversationOpened` because the user is already looking at this
     * conversation — re-opening it would reset the view they are mid-way through.
     */
    conversationIdAssigned(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload
    },
    listOpened(state) {
      state.view = 'list'
    },
    /** After deleting whatever was on screen. */
    conversationCleared(state) {
      state.activeConversationId = null
      state.view = 'list'
    },
  },
})

export const {
  panelToggled,
  panelClosed,
  conversationOpened,
  newConversationStarted,
  conversationIdAssigned,
  listOpened,
  conversationCleared,
} = chatUiSlice.actions

export const chatUiReducer = chatUiSlice.reducer

/** Keep the resumable conversation id in sync with the browser. */
export function persistConversationId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: resuming after a refresh is a convenience, not a feature
    // worth breaking the app over.
  }
}
