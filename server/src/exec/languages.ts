import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { transform } from 'esbuild'
import type { Language } from '../types.js'

export interface PreparedRun {
  command: string[]
  stdin?: string
}

type Preparer = (code: string, dir: string) => Promise<PreparedRun> | PreparedRun

/**
 * Per-language recipe for turning user code into a runnable command. Languages
 * absent from this map are not executable on the server (e.g. CSS).
 */
export const runners: Partial<Record<Language, Preparer>> = {
  javascript: async (code, dir) => {
    const file = join(dir, 'main.mjs')
    await writeFile(file, code, 'utf8')
    return { command: ['node', file] }
  },

  typescript: async (code, dir) => {
    // Strip types with esbuild, then run the emitted JS with node.
    const { code: js } = await transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2022',
    })
    const file = join(dir, 'main.mjs')
    await writeFile(file, js, 'utf8')
    return { command: ['node', file] }
  },

  python: async (code, dir) => {
    const file = join(dir, 'main.py')
    await writeFile(file, code, 'utf8')
    return { command: ['python3', file] }
  },

  bash: async (code, dir) => {
    const file = join(dir, 'main.sh')
    await writeFile(file, code, 'utf8')
    return { command: ['bash', file] }
  },

  sql: (code) => ({
    command: ['sqlite3', '-batch', ':memory:'],
    stdin: `.mode box\n.headers on\n.timeout 1000\n${code}\n`,
  }),
}

export function isRunnable(language: Language): boolean {
  return language in runners
}
