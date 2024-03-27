import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import { stylexPlugin } from 'vite-plugin-stylex-dev'
import stylexBabelPlugin from '@stylex-extend/babel-plugin'

export default defineConfig({
  plugins: [vue(), jsx({ babelPlugins: [stylexBabelPlugin.default.withOptions({ stylex: { helper: 'attrs' } })] }), stylexPlugin()]
})
