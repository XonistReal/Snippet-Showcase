import { CodeBlock } from './CodeBlock'
import type { Snippet } from '../types'

interface Props {
  snippet: Snippet
  index: number
  total: number
  votes: number
  hasVoted: boolean
  onVote: () => void
  onFork: () => void
}

function formatVotes(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function SnippetCard({
  snippet,
  index,
  total,
  votes,
  hasVoted,
  onVote,
  onFork,
}: Props) {
  return (
    <section
      className="card"
      style={{ ['--accent' as string]: snippet.accent }}
      aria-roledescription="snippet"
      aria-label={`${snippet.title} by ${snippet.author}`}
    >
      <div className="card-glow" aria-hidden />

      <div className="card-inner">
        <div className="card-main">
          <div className="card-head">
            <span className={`lang-pill lang-${snippet.language}`}>
              {snippet.language}
            </span>
            {snippet.runnable && <span className="runnable-pill">▶ runnable</span>}
            <span className="card-counter">
              {index + 1} / {total}
            </span>
          </div>

          <h1 className="card-title">{snippet.title}</h1>
          <p className="card-blurb">{snippet.blurb}</p>

          <CodeBlock code={snippet.code} language={snippet.language} />

          <div className="card-tags">
            {snippet.tags.map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>

          <div className="card-author">by {snippet.author}</div>
        </div>

        <aside className="card-actions">
          <button
            className={`action vote ${hasVoted ? 'voted' : ''}`}
            onClick={onVote}
            aria-pressed={hasVoted}
            aria-label={hasVoted ? 'Remove upvote' : 'Upvote snippet'}
          >
            <span className="action-icon">▲</span>
            <span className="action-count">{formatVotes(votes)}</span>
          </button>

          <button className="action fork" onClick={onFork} aria-label="Fork into editor">
            <span className="action-icon">⑂</span>
            <span className="action-label">Fork</span>
          </button>
        </aside>
      </div>

      <div className="swipe-hint" aria-hidden>
        {index < total - 1 ? '⌄ swipe' : '✦ end'}
      </div>
    </section>
  )
}
