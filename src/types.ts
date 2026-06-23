export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'css'
  | 'bash'
  | 'sql'

export interface Snippet {
  id: string
  title: string
  /** A one-line hook describing why the snippet is clever. */
  blurb: string
  language: Language
  code: string
  author: string
  /** Seed upvote count shown before the user interacts. */
  votes: number
  tags: string[]
  /** Whether the snippet can be executed in the live sandbox. */
  runnable: boolean
  /** Accent color used for the card's ambient glow. */
  accent: string
  /** Id of the snippet this was forked from, if any. */
  forkedFrom?: string | null
  /** Creation timestamp (epoch ms). */
  createdAt?: number
}

export interface LogLine {
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
}

export interface ExecuteResult {
  ok: boolean
  language: Language
  logs: LogLine[]
  durationMs: number
  timedOut: boolean
}
