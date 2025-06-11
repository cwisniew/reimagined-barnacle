import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // Vitest configuration
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'happy-dom', // Use happy-dom for DOM environment
    setupFiles: ['./vitest.setup.ts'], // Optional: for global test setup
    coverage: { // Optional: for coverage reports
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
})
