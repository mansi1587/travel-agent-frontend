import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets modules import as "@/api/authApi" instead of counting ../../ hops.
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // "localhost" on purpose, matching VITE_API_BASE_URL. A browser treats
    // localhost and 127.0.0.1 as different origins, so the auth cookie set by one
    // is not sent to the other.
    host: 'localhost',
    port: 5173,
    // Fail loudly if 5173 is taken rather than silently moving to 5174: the backend's
    // CORS list names this exact port, so a quiet move breaks every request with a
    // confusing CORS error instead of an obvious "port in use".
    strictPort: true,
  },
})
