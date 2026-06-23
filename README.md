# Snippet Showcase ✨

A **TikTok-style feed of short, clever code snippets.** Swipe through a
full-screen vertical reel, upvote the most elegant ones, and **fork any snippet
into a live editor** — then **actually run it** in JavaScript, TypeScript,
Python, Bash, or SQL, with output streamed back from a sandboxed backend.

![stack](https://img.shields.io/badge/React-18-61dafb) ![stack](https://img.shields.io/badge/Vite-5-646cff) ![stack](https://img.shields.io/badge/Node-22-339933) ![stack](https://img.shields.io/badge/Express-4-000000) ![stack](https://img.shields.io/badge/SQLite-better--sqlite3-003b57)

This is a full-stack app: a **React + TypeScript** SPA and a **Node/Express**
API with a **multi-language execution sandbox**. See [`PLAN.md`](./PLAN.md) for
the architecture and build plan.

## Features

- **Vertical snap feed** — one snippet per screen with smooth scroll-snapping.
  Works with touch, trackpad/wheel, mouse, and keyboard.
- **Run code for real** — fork a snippet and execute it server-side in
  **JavaScript, TypeScript, Python, Bash, or SQL**; CSS gets a live rendered
  preview. Output (and errors) stream back into an in-app console.
- **Persistent upvotes** — votes are stored server-side and deduped per
  anonymous user, so totals are shared across visitors.
- **Forking that sticks** — saved forks are persisted and appear at the top of
  the feed for everyone.
- **Syntax highlighting** for all six languages via a custom Prism theme.
- **Keyboard-first** navigation:
  - `↑`/`↓` (or `k`/`j`) — move between snippets
  - `Space` — upvote · `f` — fork
  - In the editor: `⌘/Ctrl + Enter` to run, `Esc` to close
- **Graceful offline mode** — if the API is unreachable, the SPA still demos
  with bundled snippets (JS runs client-side in a sandboxed iframe).

## Architecture

```
React + TS SPA  ──HTTP/JSON──▶  Express API ──▶ SQLite (snippets, votes)
(Vite)                                       └─▶ Execution sandbox
                                                 (subprocess + limits)
```

- The web app lives at the repo root; the backend lives in [`server/`](./server).
- In dev, Vite proxies `/api/*` to the API server on port `8787`.
- In prod, host the SPA anywhere (e.g. Vercel) and point it at the API with the
  `VITE_API_URL` env var.

## Quick start

```bash
# install web + server deps
npm run setup

# run the web app and API together (web :5173, api :8787)
npm run dev
```

Open http://localhost:5173.

<details>
<summary>Run the pieces separately</summary>

```bash
npm run dev:web                 # Vite dev server only
npm run dev:api                 # API server only (tsx watch)
npm --prefix server run start   # built API server
```

</details>

### Other scripts

```bash
npm run build          # type-check + production build of the SPA → dist/
npm run preview        # preview the built SPA
npm run lint           # ESLint
npm run server:build   # compile the API server → server/dist
```

## The execution sandbox

Forked code runs on the server inside a throwaway temp directory wrapped in
layers of protection:

| Layer                | Mechanism                                            |
| -------------------- | ---------------------------------------------------- |
| Wall-clock timeout   | `timeout -s KILL` (default 6s)                       |
| CPU / memory / files | `prlimit` (`--cpu`, `--as`, `--fsize`)               |
| Network isolation    | `unshare -rn` (auto-detected; falls back if denied)  |
| Output cap           | stdout/stderr truncated at 64 KB                     |
| Concurrency          | in-process queue (max 4 simultaneous runs)           |
| Clean env            | minimal `PATH`/`HOME`, no inherited secrets          |

| Language   | How it runs                                            |
| ---------- | ------------------------------------------------------ |
| JavaScript | `node`                                                 |
| TypeScript | `esbuild` strips types → `node`                        |
| Python     | `python3`                                              |
| Bash       | `bash`                                                 |
| SQL        | `sqlite3` against a fresh in-memory database           |
| CSS        | live visual preview rendered client-side               |

> ⚠️ **Security note:** this is hardened defense-in-depth, but executing
> arbitrary code is inherently risky. For production, run the API inside a
> locked-down container/VM (e.g. gVisor/Firecracker or per-run Docker with a
> dropped capability set and pids limit). A `server/Dockerfile` is provided as a
> starting point.

## API

| Method | Path                       | Purpose                                  |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/health`              | Status + runnable languages + isolation  |
| GET    | `/api/snippets?userId=`    | Feed + the caller's upvoted ids          |
| GET    | `/api/snippets/:id`        | A single snippet                         |
| POST   | `/api/snippets/:id/vote`   | Toggle upvote (`{ userId }`)             |
| POST   | `/api/snippets/:id/fork`   | Save a fork (`{ title, code, author? }`) |
| POST   | `/api/execute`             | Run code (`{ language, code }`)          |

## Deployment

- **Web (e.g. Vercel):** framework preset **Vite**, build `npm run build`,
  output `dist`. Set `VITE_API_URL` to your deployed API origin.
- **API:** any Node host that allows subprocess execution. Build the provided
  `server/Dockerfile`; mount a volume for `DB_PATH` to persist SQLite.

## Project layout

```
.
├── PLAN.md                 # architecture & build plan
├── index.html, vite.config.ts
├── src/                    # React SPA
│   ├── components/         # Feed, SnippetCard, CodeBlock, ForkEditor
│   ├── lib/                # api client, identity, prism, iframe runner
│   ├── data/snippets.ts    # offline fallback reel
│   └── index.css
└── server/                 # Express API + execution sandbox
    ├── src/
    │   ├── index.ts        # app bootstrap
    │   ├── db.ts           # SQLite schema, queries, seed
    │   ├── routes/         # snippets + execute
    │   └── exec/           # sandbox, language runners, dispatcher
    └── Dockerfile
```
