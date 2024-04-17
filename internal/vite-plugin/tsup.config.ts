import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  shims: true,
  dts: true,
  format: ['esm'],
  clean: true,
  external: ['vite', '@stylex-extend/babel-plugin']
})
