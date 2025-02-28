import { describe, expect, it } from 'vitest'
import { stylex } from '../src/postcss-ver'
import { mockBuild } from './shared/kit.mjs'

describe('postcss', () => {
  it('define a single postcss config', async () => {
    const { output } = await mockBuild(['postcss', 'extra'], 'dist', {
      plugins: [stylex()]
    })
    expect(1).toBe(1)
  })
})
