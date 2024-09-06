import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

import { stylex } from '@stylex-extend/vite'

export default defineConfig({
  plugins: [vue(), jsx(), stylex({ enableStylexExtend: { stylex: { helper: 'attrs' } } })],
  optimizeDeps: {
    exclude: ['@stylex-extend/core']
  }
})
