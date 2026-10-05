import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served as a GitHub Pages *project* site, i.e. under the /LeadBack/ path:
  //   https://oumar9018-cmd.github.io/LeadBack/
  // With base '/' the built index.html asked for /assets/*.js at the origin
  // root, which 404s on a project site and leaves a blank white page.
  // NOTE: if the leadback.app custom domain is ever enabled in Pages settings
  // (currently cname: null), this must go back to '/'.
  base: '/LeadBack/',
  plugins: [react()],
  server: {
    // Allow the Arena preview proxy host in development.
    allowedHosts: true,
  },
})
