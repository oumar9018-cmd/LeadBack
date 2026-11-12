import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from the custom domain backwon.qd.je at the origin root:
  //   https://backwon.qd.je/
  // The custom domain IS enabled in Pages settings (public/CNAME), so the
  // site lives at '/', NOT under the old /LeadBack/ project-site path.
  // With base '/LeadBack/' the built index.html asked for
  // /LeadBack/assets/*.js on the custom domain, which 404s and leaves the
  // page unstyled (raw text, no CSS/JS).
  base: '/',
  plugins: [react()],
  server: {
    // Allow the Arena preview proxy host in development.
    allowedHosts: true,
  },
  preview: {
    // Same for `vite preview` (serves the prerendered production build).
    allowedHosts: true,
  },
})
