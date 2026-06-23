import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ExecuteResult, Language, LogLine } from '../types.js'
import { runners } from './languages.js'
import { isNetworkIsolated, runSandboxed } from './sandbox.js'

/** Simple concurrency gate so the host isn't overwhelmed by parallel runs. */
const MAX_CONCURRENT = 4
let active = 0
const waiters: Array<() => void> = []

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++
    return
  }
  await new Promise<void>((r) => waiters.push(r))
  active++
}

function release(): void {
  active--
  const next = waiters.shift()
  if (next) next()
}

function toLogs(text: string, level: LogLine['level']): LogLine[] {
  if (!text) return []
  const trimmed = text.replace(/\n+$/, '')
  if (!trimmed) return []
  return trimmed.split('\n').map((line) => ({ level, text: line }))
}

export async function execute(
  language: Language,
  code: string,
): Promise<ExecuteResult> {
  const prepare = runners[language]
  if (!prepare) {
    return {
      ok: false,
      language,
      logs: [{ level: 'error', text: `${language} is not executable on the server.` }],
      durationMs: 0,
      timedOut: false,
    }
  }

  await acquire()
  const dir = await mkdtemp(join(tmpdir(), 'snip-'))
  try {
    const prepared = await prepare(code, dir)
    const result = await runSandboxed(prepared.command, dir, undefined, prepared.stdin)

    const logs: LogLine[] = [
      ...toLogs(result.stdout, 'log'),
      ...toLogs(result.stderr, 'error'),
    ]

    if (result.timedOut) {
      logs.push({
        level: 'error',
        text: 'Execution timed out and was terminated (possible infinite loop).',
      })
    }
    if (result.truncated) {
      logs.push({ level: 'warn', text: 'Output truncated at 64 KB.' })
    }
    if (logs.length === 0) {
      logs.push({ level: 'info', text: '(no output)' })
    }

    return {
      ok: !result.timedOut && (result.exitCode === 0 || result.exitCode === null),
      language,
      logs,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
    }
  } catch (err) {
    return {
      ok: false,
      language,
      logs: [{ level: 'error', text: `Execution error: ${(err as Error).message}` }],
      durationMs: 0,
      timedOut: false,
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
    release()
  }
}

export { isNetworkIsolated }
