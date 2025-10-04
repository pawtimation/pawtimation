import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5000,
    // Allow any *.repl.co host (Replit generates a random subdomain)
    allowedHosts: [/\.repl\.co$/]
  }
})
