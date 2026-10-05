import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Deployed at the custom domain root (leadback.app), not under a sub-path.
  base: '/',
  plugins: [react()],
  server: {
    // Allow the Arena preview proxy host in development.
    allowedHosts: true,
  },
})
