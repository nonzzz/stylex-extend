import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { stylex } from '@stylex-extend/vite'

export default defineConfig({
  plugins: [
    react(),
    stylex()
  ]
})
