import styleXExtendPlugin from '@stylex-extend/babel-plugin'
import styleXPlugin from '@stylexjs/babel-plugin'
import path from 'path'
import url from 'url'

export const __filename = url.fileURLToPath(import.meta.url)

export const __dirname = path.dirname(__filename)

export default {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: [
        'src/client/pages/**/*.{js,jsx,ts,tsx}',
        'src/client/themes/**/*.{js,jsx,ts,tsx}',
        'src/client/components/**/*.{js,jsx,ts,tsx}',
        'src/client/application.tsx'
      ],
      babelConfig: {
        parserOpts: {
          plugins: ['jsx', 'typescript']
        },
        plugins: [
          [
            styleXExtendPlugin,
            {
              unstable_moduleResolution: {
                type: 'commonJS',
                rootDir: __dirname
              },
              transport: 'props'
            }
          ],
          [
            styleXPlugin,
            {
              runtimeInjection: false,
              dev: false,
              // Required for CSS variable support
              unstable_moduleResolution: {
                type: 'commonJS',
                rootDir: __dirname
              }
            }
          ]
        ]
      }
    }
  }
}
