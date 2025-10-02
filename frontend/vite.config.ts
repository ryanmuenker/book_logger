import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/books': 'http://127.0.0.1:5000',
      '/vocab': 'http://127.0.0.1:5000',
      '/auth': 'http://127.0.0.1:5000',
      '/export.csv': 'http://127.0.0.1:5000',
      '/export.json': 'http://127.0.0.1:5000',
    },
  },
})


