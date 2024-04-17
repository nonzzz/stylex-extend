import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import { stylexPlugin } from 'vite-plugin-stylex-dev'
import { stylexExtendPlugin } from '@stylex-extend/vite-plugin'

export default defineConfig({
  plugins: [vue(), stylexExtendPlugin({ stylex: { helper: 'attrs' } }), jsx(), stylexPlugin()]
})
