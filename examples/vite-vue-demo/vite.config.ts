import { stylex } from '@stylex-extend/vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [VueRouter(), vue(), jsx(), stylex({ macroTransport: 'attrs', useCSSLayer: true, macroTransformOrder: 'post' })],
  optimizeDeps: {
    exclude: ['@stylex-extend/core']
  }
})
