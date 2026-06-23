import { spawn, spawnSync } from 'node:child_process'

export interface SandboxLimits {
  /** Wall-clock seconds before SIGKILL. */
  wallSeconds: number
  /** CPU seconds (RLIMIT_CPU). */
  cpuSeconds: number
  /** Address space cap in bytes (RLIMIT_AS). */
  addressSpaceBytes: number
  /** Max file size the process may create, in bytes (RLIMIT_FSIZE). */
  fileSizeBytes: number
}

export const DEFAULT_LIMITS: SandboxLimits = {
  wallSeconds: 6,
  cpuSeconds: 5,
  addressSpaceBytes: 2 * 1024 * 1024 * 1024,
  fileSizeBytes: 8 * 1024 * 1024,
}

const MAX_OUTPUT_BYTES = 64 * 1024

export interface RunResult {
  stdout: string
  stderr: string
  timedOut: boolean
  exitCode: number | null
  durationMs: number
  truncated: boolean
}

/**
 * Detect once whether we can drop the process into an isolated network
 * namespace (via `unshare -rn`). When available, executed code cannot reach the
 * network. Falls back gracefully when the host forbids it.
 */
const networkIsolation = (() => {
  try {
    const probe = spawnSync('unshare', ['-rn', '--', 'true'], { timeout: 3000 })
    return probe.status === 0
  } catch {
    return false
  }
})()

export function isNetworkIsolated(): boolean {
  return networkIsolation
}

/**
 * Run a command under layered limits in the given working directory.
 *
 * Layering (outermost first): `unshare -rn` (net isolation) → `timeout`
 * (wall clock) → `prlimit` (cpu / memory / file size) → the actual command.
 */
export function runSandboxed(
  command: string[],
  cwd: string,
  limits: SandboxLimits = DEFAULT_LIMITS,
  stdin?: string,
): Promise<RunResult> {
  const prlimitArgs = [
    'prlimit',
    `--cpu=${limits.cpuSeconds}`,
    `--as=${limits.addressSpaceBytes}`,
    `--fsize=${limits.fileSizeBytes}`,
    '--',
    ...command,
  ]
  const timeoutArgs = [
    'timeout',
    '-s',
    'KILL',
    String(limits.wallSeconds),
    ...prlimitArgs,
  ]
  const [bin, ...args] = networkIsolation
    ? ['unshare', '-rn', '--', ...timeoutArgs]
    : timeoutArgs

  return new Promise((resolveRun) => {
    const start = Date.now()
    const child = spawn(bin, args, {
      cwd,
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: cwd,
        LANG: 'C.UTF-8',
        // Make python flush immediately so output isn't lost on kill.
        PYTHONUNBUFFERED: '1',
        NODE_OPTIONS: '--max-old-space-size=256',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let truncated = false

    const collect = (buf: Buffer, target: 'out' | 'err') => {
      const current = target === 'out' ? stdout.length : stderr.length
      if (current >= MAX_OUTPUT_BYTES) {
        truncated = true
        return
      }
      const text = buf.toString('utf8')
      const room = MAX_OUTPUT_BYTES - current
      const slice = text.length > room ? text.slice(0, room) : text
      if (text.length > room) truncated = true
      if (target === 'out') stdout += slice
      else stderr += slice
    }

    child.stdout.on('data', (b: Buffer) => collect(b, 'out'))
    child.stderr.on('data', (b: Buffer) => collect(b, 'err'))

    if (stdin) {
      child.stdin.write(stdin)
    }
    child.stdin.end()

    child.on('error', (err) => {
      resolveRun({
        stdout,
        stderr: stderr + `\n[sandbox] failed to start: ${err.message}`,
        timedOut: false,
        exitCode: null,
        durationMs: Date.now() - start,
        truncated,
      })
    })

    child.on('close', (code, signal) => {
      // `timeout` exits 124 (or kills with SIGKILL) when the limit is hit.
      const timedOut = code === 124 || signal === 'SIGKILL'
      resolveRun({
        stdout,
        stderr,
        timedOut,
        exitCode: code,
        durationMs: Date.now() - start,
        truncated,
      })
    })
  })
}
