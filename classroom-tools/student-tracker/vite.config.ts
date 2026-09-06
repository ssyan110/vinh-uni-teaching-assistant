import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Keep the built app usable when opened directly from Finder via file://.
  base: './',
  server: {
    host: '127.0.0.1',
    port: 4317,
  },
  preview: {
    host: '127.0.0.1',
    port: 4318,
  },
})
