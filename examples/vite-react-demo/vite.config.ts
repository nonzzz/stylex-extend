import { stylex } from '@stylex-extend/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    stylex()
  ]
})
