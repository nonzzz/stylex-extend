import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { stylex } from 'vite-plugin-stylex-dev'

export default defineConfig({
  plugins: [
    react(),
    stylex({ enableStylexExtend: true })
  ]
})
