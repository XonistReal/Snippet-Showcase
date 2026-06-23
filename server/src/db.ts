import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { seedSnippets } from './seed.js'
import type { Snippet } from './types.js'

const DB_PATH = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : resolve(process.cwd(), 'data', 'snippets.db')

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS snippets (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    blurb       TEXT NOT NULL,
    language    TEXT NOT NULL,
    code        TEXT NOT NULL,
    author      TEXT NOT NULL,
    base_votes  INTEGER NOT NULL DEFAULT 0,
    tags        TEXT NOT NULL DEFAULT '[]',
    runnable    INTEGER NOT NULL DEFAULT 0,
    accent      TEXT NOT NULL DEFAULT '#7c5cff',
    forked_from TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votes (
    snippet_id TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (snippet_id, user_id),
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at);
  CREATE INDEX IF NOT EXISTS idx_votes_snippet ON votes(snippet_id);
`)

export function seedIfEmpty(): void {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM snippets').get() as { n: number }).n
  if (count > 0) return

  const insert = db.prepare(`
    INSERT INTO snippets
      (id, title, blurb, language, code, author, base_votes, tags, runnable, accent, forked_from, created_at)
    VALUES
      (@id, @title, @blurb, @language, @code, @author, @baseVotes, @tags, @runnable, @accent, NULL, @createdAt)
  `)
  const now = Date.now()
  const tx = db.transaction(() => {
    seedSnippets.forEach((s, i) => {
      insert.run({
        ...s,
        tags: JSON.stringify(s.tags),
        runnable: s.runnable ? 1 : 0,
        // Preserve reel order; earlier items are "older".
        createdAt: now - (seedSnippets.length - i) * 1000,
      })
    })
  })
  tx()
}

interface SnippetRow {
  id: string
  title: string
  blurb: string
  language: string
  code: string
  author: string
  base_votes: number
  tags: string
  runnable: number
  accent: string
  forked_from: string | null
  created_at: number
  vote_count: number
}

function rowToSnippet(r: SnippetRow): Snippet {
  return {
    id: r.id,
    title: r.title,
    blurb: r.blurb,
    language: r.language as Snippet['language'],
    code: r.code,
    author: r.author,
    votes: r.base_votes + r.vote_count,
    tags: JSON.parse(r.tags) as string[],
    runnable: r.runnable === 1,
    accent: r.accent,
    forkedFrom: r.forked_from,
    createdAt: r.created_at,
  }
}

const selectBase = `
  SELECT s.*, (
    SELECT COUNT(*) FROM votes v WHERE v.snippet_id = s.id
  ) AS vote_count
  FROM snippets s
`

/**
 * Feed order: user-created forks first (newest), then the curated reel in its
 * original order so the showcase always opens on the hand-picked snippets.
 */
export function listSnippets(): Snippet[] {
  const rows = db
    .prepare(
      `${selectBase}
       ORDER BY (s.forked_from IS NOT NULL) DESC,
                CASE WHEN s.forked_from IS NOT NULL THEN s.created_at END DESC,
                s.created_at ASC`,
    )
    .all() as SnippetRow[]
  return rows.map(rowToSnippet)
}

export function getSnippet(id: string): Snippet | undefined {
  const row = db.prepare(`${selectBase} WHERE s.id = ?`).get(id) as
    | SnippetRow
    | undefined
  return row ? rowToSnippet(row) : undefined
}

export interface ForkInput {
  parentId: string
  title: string
  code: string
  author: string
}

export function createFork(input: ForkInput, newId: string): Snippet | undefined {
  const parent = db.prepare('SELECT * FROM snippets WHERE id = ?').get(input.parentId) as
    | SnippetRow
    | undefined
  if (!parent) return undefined

  db.prepare(`
    INSERT INTO snippets
      (id, title, blurb, language, code, author, base_votes, tags, runnable, accent, forked_from, created_at)
    VALUES
      (@id, @title, @blurb, @language, @code, @author, 0, @tags, @runnable, @accent, @forkedFrom, @createdAt)
  `).run({
    id: newId,
    title: input.title,
    blurb: `Forked from ${parent.title}`,
    language: parent.language,
    code: input.code,
    author: input.author,
    tags: parent.tags,
    runnable: parent.runnable,
    accent: parent.accent,
    forkedFrom: parent.id,
    createdAt: Date.now(),
  })
  return getSnippet(newId)
}

export interface VoteResult {
  votes: number
  voted: boolean
}

export function toggleVote(snippetId: string, userId: string): VoteResult | undefined {
  const exists = db.prepare('SELECT 1 FROM snippets WHERE id = ?').get(snippetId)
  if (!exists) return undefined

  const has = db
    .prepare('SELECT 1 FROM votes WHERE snippet_id = ? AND user_id = ?')
    .get(snippetId, userId)

  if (has) {
    db.prepare('DELETE FROM votes WHERE snippet_id = ? AND user_id = ?').run(
      snippetId,
      userId,
    )
  } else {
    db.prepare(
      'INSERT INTO votes (snippet_id, user_id, created_at) VALUES (?, ?, ?)',
    ).run(snippetId, userId, Date.now())
  }

  const snippet = getSnippet(snippetId)!
  return { votes: snippet.votes, voted: !has }
}

/** Returns the set of snippet ids a given user has upvoted. */
export function votesByUser(userId: string): string[] {
  const rows = db
    .prepare('SELECT snippet_id FROM votes WHERE user_id = ?')
    .all(userId) as { snippet_id: string }[]
  return rows.map((r) => r.snippet_id)
}
