import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import { stylex } from 'vite-plugin-stylex-dev'

export default defineConfig({
  plugins: [vue(), jsx(), stylex({ enableStylexExtend: { stylex: { helper: 'attrs' } } })],
  optimizeDeps: {
    exclude: ['@stylex-extend/core']
  }
})
