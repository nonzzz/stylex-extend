import { builtinModules, createRequire } from 'module'
import { defineConfig } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import { swc } from 'rollup-plugin-swc3'
import shim from '@rollup/plugin-esm-shim'

// https://www.typescriptlang.org/tsconfig/#preserveSymlinks

const _require = createRequire(import.meta.url)

const external = [
  ...builtinModules,
  ...Object.keys(_require('./package.json').dependencies)
]

export default defineConfig(
  [
    {
      input: 'src/index.ts',
      output: [
        { file: 'dist/index.js', format: 'cjs' },
        { file: 'dist/index.mjs', format: 'es' }
      ],
      plugins: [swc(), shim()],
      external
    },
    {
      input: 'src/index.ts',
      output: { file: 'dist/index.d.ts', format: 'es' },
      plugins: [dts({ compilerOptions: { preserveSymlinks: false } })],
      external
    }
  ]
)
