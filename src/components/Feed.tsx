import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SnippetCard } from './SnippetCard'
import { ForkEditor } from './ForkEditor'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { snippets } from '../data/snippets'
import type { Snippet } from '../types'

export function Feed() {
  const [votedIds, setVotedIds] = useLocalStorage<string[]>('snippet-votes', [])
  const [active, setActive] = useState(0)
  const [forking, setForking] = useState<Snippet | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const voted = useMemo(() => new Set(votedIds), [votedIds])

  const toggleVote = useCallback(
    (id: string) => {
      setVotedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      )
    },
    [setVotedIds],
  )

  // Track which card is centered in the viewport.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            setActive(idx)
          }
        }
      },
      { root: scroller, threshold: 0.6 },
    )
    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(snippets.length - 1, idx))
    cardRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Keyboard navigation (disabled while the editor is open).
  useEffect(() => {
    if (forking) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        goTo(active + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goTo(active - 1)
      } else if (e.key === 'f') {
        setForking(snippets[active])
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleVote(snippets[active].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, forking, goTo, toggleVote])

  return (
    <div className="feed-wrap">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✨</span>
          <span className="brand-name">Snippet Showcase</span>
        </div>
        <nav className="progress" aria-label="Feed progress">
          {snippets.map((s, i) => (
            <button
              key={s.id}
              className={`dot ${i === active ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to snippet ${i + 1}: ${s.title}`}
              aria-current={i === active}
            />
          ))}
        </nav>
      </header>

      <div className="scroller" ref={scrollerRef}>
        {snippets.map((snippet, i) => {
          const extra = voted.has(snippet.id) ? 1 : 0
          return (
            <div
              key={snippet.id}
              className="card-slot"
              data-index={i}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
            >
              <SnippetCard
                snippet={snippet}
                index={i}
                total={snippets.length}
                votes={snippet.votes + extra}
                hasVoted={voted.has(snippet.id)}
                onVote={() => toggleVote(snippet.id)}
                onFork={() => setForking(snippet)}
              />
            </div>
          )
        })}
      </div>

      {forking && (
        <ForkEditor snippet={forking} onClose={() => setForking(null)} />
      )}
    </div>
  )
}
