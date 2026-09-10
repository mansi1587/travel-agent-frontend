import { Provider } from 'react-redux'
import { Toaster } from 'sonner'

import { store } from '@/app/store'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
      <Toaster position="top-center" richColors closeButton />
    </Provider>
  )
}
