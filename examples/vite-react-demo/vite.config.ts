import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { stylexPlugin } from 'vite-plugin-stylex-dev'
import stylexBabelPlugin from '@stylex-extend/babel-plugin'

export default defineConfig({
  plugins: [
    react({
      babel: {
        babelrc: false,
        plugins: [stylexBabelPlugin]
      }
    }), stylexPlugin()
  ]
})
