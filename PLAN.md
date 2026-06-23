# Snippet Showcase — Full-Stack Build Plan

> **Vision:** A TikTok-style feed of short, clever code snippets. Swipe through,
> upvote the most elegant ones, and fork them instantly into a live editor —
> now with a **real backend** and the ability to **actually run** snippets in
> multiple languages.

This document is the plan of record. It is implemented incrementally; each phase
maps to one or more commits.

---

## 1. Where we are vs. where we're going

| Capability        | Before (front-end only)              | After (full-stack)                                   |
| ----------------- | ------------------------------------ | ---------------------------------------------------- |
| Snippet data      | Hard-coded array in the bundle       | Persisted in SQLite, served via REST API             |
| Upvotes           | `localStorage` only                  | Persisted server-side, deduped per anonymous user    |
| Forking           | Edits live only in the open modal    | Forks saved server-side and appear in the feed       |
| Running code      | JavaScript only, in a browser iframe | **JS, TS, Python, Bash, SQL executed on the server** |
| Architecture      | Single Vite SPA                      | Vite SPA + Node/Express API + execution sandbox      |

---

## 2. Architecture

```
┌──────────────────┐        HTTP/JSON        ┌───────────────────────────┐
│  Web app (Vite)  │  ───────────────────▶   │  API server (Express/TS)  │
│  React + TS      │   /api/snippets         │                           │
│                  │   /api/.../vote         │  ┌─────────────────────┐  │
│  - Feed          │   /api/.../fork         │  │ SQLite (better-      │  │
│  - Fork editor   │   /api/execute          │  │ sqlite3) persistence │  │
│  - Live console  │ ◀───────────────────    │  └─────────────────────┘  │
└──────────────────┘                         │  ┌─────────────────────┐  │
                                             │  │ Execution sandbox   │  │
                                             │  │ (subprocess + limits)│  │
                                             │  └─────────────────────┘  │
                                             └───────────────────────────┘
```

- **Repo layout:** the existing Vite app stays at the repo root (so the current
  Vercel setup keeps working). The backend lives in `server/` as an independent
  package.
- **Dev:** Vite dev server proxies `/api/*` to the API server (`:8787`).
- **Prod:** the SPA is hosted on Vercel; the API server is deployed separately
  (Render/Railway/Fly/VM). The client reads the API base from
  `VITE_API_URL` (defaults to same-origin `/api`).

---

## 3. Backend

**Stack:** Node 22, Express 4, TypeScript, `better-sqlite3` (synchronous, no
external DB service), `esbuild` (TS→JS transpile for execution), `zod`
(request validation).

### 3.1 Data model (SQLite)

```
snippets(
  id TEXT PK, title, blurb, language, code, author,
  base_votes INTEGER,        -- seed votes for showcase appeal
  tags TEXT,                 -- JSON array
  runnable INTEGER,          -- 0/1
  accent TEXT,
  forked_from TEXT NULL,     -- parent snippet id
  created_at INTEGER
)

votes(
  snippet_id TEXT, user_id TEXT,   -- anonymous id from client
  created_at INTEGER,
  PRIMARY KEY (snippet_id, user_id)
)
```

Vote total returned to the client = `base_votes + COUNT(votes)`.

### 3.2 REST API

| Method | Path                       | Purpose                                          |
| ------ | -------------------------- | ------------------------------------------------ |
| GET    | `/api/health`              | Liveness + which language runtimes are available |
| GET    | `/api/snippets`            | Feed (newest forks first, then seed reel)        |
| GET    | `/api/snippets/:id`        | Single snippet                                   |
| POST   | `/api/snippets/:id/fork`   | Save an edited copy as a new snippet             |
| POST   | `/api/snippets/:id/vote`   | Toggle upvote for `userId` (idempotent)          |
| POST   | `/api/execute`             | Run code: `{ language, code }` → console output  |

Identity: the client generates a random `userId` (stored in `localStorage`) and
sends it with vote/fork requests. No login required (keeps the showcase
frictionless); the model leaves room to add real auth later.

---

## 4. Execution engine (the core new capability)

A registry of language runners. Each request runs in an isolated, throwaway temp
directory and is wrapped in layered resource limits.

### 4.1 Supported languages

| Language   | How it runs                                            |
| ---------- | ------------------------------------------------------ |
| JavaScript | `node file.js`                                         |
| TypeScript | `esbuild` transpiles → `node file.js`                  |
| Python     | `python3 file.py`                                      |
| Bash       | `bash file.sh`                                          |
| SQL        | Executed against a fresh in-memory `better-sqlite3` DB |
| CSS        | Not executed on the server — rendered as a live visual preview in the client |

### 4.2 Sandboxing & safety

Arbitrary code execution is dangerous; we apply defense-in-depth:

1. **Wall-clock timeout** via `timeout -s KILL <secs>` (default 5s).
2. **Resource limits** via `prlimit`: CPU seconds, address space (memory),
   max file size, and process count (anti fork-bomb).
3. **Throwaway working dir** per run (`mkdtemp`), deleted afterward.
4. **Output cap** (truncate stdout/stderr at 64 KB).
5. **Minimal env** (no inherited secrets; only `PATH`, `HOME=tmpdir`).
6. **Network isolation (best-effort):** use `unshare -n` when permitted.
7. **Concurrency cap:** a small in-process queue limits simultaneous runs.

> ⚠️ This is hardened but not a substitute for full container/VM isolation. For
> production, run the executor inside a locked-down container (gVisor/Firecracker
> or per-run Docker). Documented in the server README.

### 4.3 Response shape

```jsonc
{
  "ok": true,
  "language": "python",
  "logs": [{ "level": "log" | "error", "text": "..." }],
  "durationMs": 42,
  "timedOut": false
}
```

SQL returns rendered result tables in `logs`.

---

## 5. Frontend integration

1. **API client** (`src/lib/api.ts`) with a configurable base URL + graceful
   fallback to the bundled seed snippets when the API is unreachable (so the
   Vercel-only deploy still demos).
2. **Anonymous identity** (`src/lib/identity.ts`).
3. **Feed** loads from `/api/snippets`; votes call the API (optimistic UI).
4. **Fork editor**:
   - "Run" sends code to `/api/execute` and streams the real console output
     (replacing the JS-only iframe path; iframe stays as offline fallback).
   - "Save fork" persists the edited snippet via `/api/snippets/:id/fork`, after
     which it appears at the top of the feed.
   - Languages that now run get the ▶ Run button (JS, TS, Python, Bash, SQL).
   - CSS gets a live rendered preview pane.

---

## 6. Tooling & DX

- Root scripts: `npm run dev` runs web + server together (via `concurrently`).
- `server/` scripts: `dev` (tsx watch), `build` (tsc), `start`, `seed`.
- `.env.example` documenting `VITE_API_URL` and server `PORT`.
- Vite dev proxy for `/api`.

---

## 7. Deployment notes

- **Web:** Vercel (unchanged). Set `VITE_API_URL` to the deployed API origin.
- **API:** any Node host. Provide a `Dockerfile` for the server so the execution
  sandbox runs in a contained environment. SQLite file persisted on a volume.

---

## 8. Milestones / checklist

- [x] **P0** Plan committed (this file)
- [x] **P1** Server scaffold: Express + TS + SQLite schema + seed
- [x] **P2** Snippet + vote + fork REST endpoints
- [x] **P3** Execution engine: JS, TS, Python, Bash, SQL + sandbox limits
- [x] **P4** Frontend: API client, identity, feed/vote/fork wired to API
- [x] **P5** Frontend: real "Run" via API; CSS live preview
- [x] **P6** DX: combined dev script, proxy, env, server Dockerfile
- [x] **P7** Docs: update README; verify build, lint, and end-to-end run
```
