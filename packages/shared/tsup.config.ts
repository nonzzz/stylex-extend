import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  dts: true,
  format: ['esm', 'cjs']
})
