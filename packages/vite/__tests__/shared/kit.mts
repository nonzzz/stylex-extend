import fsp from 'fs/promises'
import path from 'path'
import url from 'url'
import { build } from 'vite'

import type { InlineConfig } from 'vite'

export const __filename = url.fileURLToPath(import.meta.url)

export const __dirname = path.dirname(__filename)

export function getId() {
  return Math.random().toString(36).substring(7)
}

export function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export async function mockBuild(fixture: string | string[], dest: string, options?: InlineConfig) {
  const id = getId()
  const output = path.join(dest, id)
  const bundle = await build({
    root: path.resolve(__dirname, '..', 'fixtures', Array.isArray(fixture) ? path.join(...fixture) : fixture),
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir: output,
      write: false
    },
    ...options
  })

  return { output, bundle }
}

export async function readAll(entry: string) {
  const paths = await Promise.all((await fsp.readdir(entry)).map((dir) => path.join(entry, dir)))
  let pos = 0
  const result: string[] = []
  while (pos !== paths.length) {
    const dir = paths[pos]
    const stat = await fsp.stat(dir)
    if (stat.isDirectory()) {
      const dirs = await fsp.readdir(dir)
      paths.push(...dirs.map((sub) => path.join(dir, sub)))
    }
    if (stat.isFile()) {
      result.push(dir)
    }
    pos++
  }
  return result
}
