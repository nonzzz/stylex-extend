import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  shims: true,
  dts: true,
  format: ['esm', 'cjs'],
  clean: true
})
