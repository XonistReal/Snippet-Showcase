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
  blurb: string
  language: Language
  code: string
  author: string
  votes: number
  tags: string[]
  runnable: boolean
  accent: string
  forkedFrom?: string | null
  createdAt: number
}

/** Shape used to seed the database. */
export interface SeedSnippet {
  id: string
  title: string
  blurb: string
  language: Language
  code: string
  author: string
  baseVotes: number
  tags: string[]
  runnable: boolean
  accent: string
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
