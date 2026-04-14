import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundle @react-pdf/renderer so Vite doesn't choke on its CJS internals
    include: ['@react-pdf/renderer'],
  },
  build: {
    // Split the heavy PDF renderer into its own chunk so the main bundle stays lean
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-renderer': ['@react-pdf/renderer'],
        },
      },
    },
    // Raise the warning threshold – @react-pdf/renderer is inherently large
    chunkSizeWarningLimit: 600,
  },
})
