import { snippets as seedSnippets } from '../data/snippets'
import type { ExecuteResult, Language, Snippet } from '../types'

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const url = (path: string) => `${API_BASE}/api${path}`

export interface FeedResponse {
  snippets: Snippet[]
  votedIds: string[]
  /** False when the API is unreachable and bundled seed data is used. */
  online: boolean
}

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchFeed(userId: string): Promise<FeedResponse> {
  try {
    const data = await jsonFetch<{ snippets: Snippet[]; votedIds: string[] }>(
      url(`/snippets?userId=${encodeURIComponent(userId)}`),
    )
    return { ...data, online: true }
  } catch {
    // Offline / API-less deploy: fall back to the bundled reel.
    return { snippets: seedSnippets, votedIds: [], online: false }
  }
}

export async function toggleVote(
  id: string,
  userId: string,
): Promise<{ votes: number; voted: boolean }> {
  return jsonFetch(url(`/snippets/${id}/vote`), {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function forkSnippet(
  id: string,
  payload: { title: string; code: string; author?: string },
): Promise<Snippet> {
  const data = await jsonFetch<{ snippet: Snippet }>(url(`/snippets/${id}/fork`), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.snippet
}

export async function executeCode(
  language: Language,
  code: string,
): Promise<ExecuteResult> {
  return jsonFetch<ExecuteResult>(url('/execute'), {
    method: 'POST',
    body: JSON.stringify({ language, code }),
  })
}
