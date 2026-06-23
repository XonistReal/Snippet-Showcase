# Snippet Showcase ✨

A **TikTok-style feed of short, clever code snippets.** Swipe through a
full-screen vertical reel, upvote the most elegant ones, and **fork any snippet
instantly into a live editor** — runnable JavaScript executes in a sandbox right
in your browser.

![stack](https://img.shields.io/badge/React-18-61dafb) ![stack](https://img.shields.io/badge/Vite-5-646cff) ![stack](https://img.shields.io/badge/TypeScript-5-3178c6)

## Features

- **Vertical snap feed** — one snippet per screen with smooth scroll-snapping,
  just like a short-video app. Works with touch, trackpad, mouse wheel, and
  keyboard.
- **Syntax highlighting** for JavaScript, TypeScript, Python, CSS, Bash, and SQL
  via a custom Prism theme.
- **Upvotes that stick** — tap the ▲ to upvote; your votes persist across
  reloads via `localStorage`, with a satisfying pop animation.
- **Fork into a live editor** — open any snippet in an in-app code editor with
  live syntax highlighting. Runnable JavaScript snippets execute in a
  **sandboxed cross-origin iframe** with captured `console` output and an
  infinite-loop timeout guard.
- **Keyboard-first** navigation:
  - `↑` / `↓` (or `k` / `j`) — move between snippets
  - `Space` — upvote the current snippet
  - `f` — fork the current snippet
  - In the editor: `⌘/Ctrl + Enter` to run, `Esc` to close
- **Polished, responsive UI** — ambient per-snippet accent glow, glassy cards,
  and a layout that adapts from desktop to phone.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## How it works

```
src/
├── data/snippets.ts      # the curated reel of snippets
├── components/
│   ├── Feed.tsx          # snap-scroll feed, vote state, keyboard nav
│   ├── SnippetCard.tsx   # a single full-screen snippet card
│   ├── CodeBlock.tsx     # Prism-highlighted read-only code
│   └── ForkEditor.tsx    # the fork-to-edit modal + console
├── lib/
│   ├── prism.ts          # Prism setup + highlight helper
│   └── runner.ts         # sandboxed JS execution + console capture
├── hooks/useLocalStorage.ts
└── index.css             # theme, layout, animations, syntax colors
```

### Safe code execution

Forked JavaScript runs inside an `<iframe sandbox="allow-scripts">` with a
randomized message token. The sandbox has **no access to the host page's DOM,
cookies, or storage**. `console.*` calls are serialized and forwarded to the
editor's console pane, and a hard 2-second timeout tears the frame down to stop
runaway loops.

## Adding your own snippets

Append an entry to `src/data/snippets.ts`:

```ts
{
  id: 'my-snippet',
  title: 'My clever trick',
  blurb: 'A one-line hook explaining why it is cool.',
  language: 'javascript',  // also: typescript | python | css | bash | sql
  author: '@you',
  votes: 0,
  tags: ['arrays', 'one-liner'],
  runnable: true,          // true only for browser-safe JavaScript
  accent: '#7c5cff',       // ambient card glow
  code: `console.log('hello feed');`,
}
```
