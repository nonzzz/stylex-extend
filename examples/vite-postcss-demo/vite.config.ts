import { stylex } from '@stylex-extend/vite/postcss-ver'
import react from '@vitejs/plugin-react'
import path from 'path'
import url from 'url'
import { defineConfig } from 'vite'

const __filename = url.fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    react(),
    stylex({
      mactroTransport: 'props',
      postcss: {
        include: ['examples/vite-postcss-demo/src/**/*.tsx'],
        aliases: {
          '~/*': [path.join(__dirname, 'src/*')]
        }
      }
    })
  ]
})
