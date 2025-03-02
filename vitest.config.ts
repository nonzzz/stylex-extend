import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.{ts,tsx}'],
    exclude: ['**/__tests__/**/fixtures/**'],
    globals: true,
    watch: false
  }
})
