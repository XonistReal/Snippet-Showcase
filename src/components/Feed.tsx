import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SnippetCard } from './SnippetCard'
import { ForkEditor } from './ForkEditor'
import { fetchFeed, toggleVote as apiToggleVote } from '../lib/api'
import { getUserId } from '../lib/identity'
import type { Snippet } from '../types'

export function Feed() {
  const userId = useMemo(getUserId, [])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [active, setActive] = useState(0)
  const [forking, setForking] = useState<Snippet | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let cancelled = false
    fetchFeed(userId).then((res) => {
      if (cancelled) return
      setSnippets(res.snippets)
      setVoted(new Set(res.votedIds))
      setOnline(res.online)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const toggleVote = useCallback(
    (id: string) => {
      // Optimistic update.
      const wasVoted = voted.has(id)
      setVoted((prev) => {
        const next = new Set(prev)
        if (wasVoted) next.delete(id)
        else next.add(id)
        return next
      })
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, votes: s.votes + (wasVoted ? -1 : 1) } : s,
        ),
      )
      if (!online) return
      apiToggleVote(id, userId)
        .then((res) => {
          setSnippets((prev) =>
            prev.map((s) => (s.id === id ? { ...s, votes: res.votes } : s)),
          )
        })
        .catch(() => {
          // Roll back on failure.
          setVoted((prev) => {
            const next = new Set(prev)
            if (wasVoted) next.add(id)
            else next.delete(id)
            return next
          })
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, votes: s.votes + (wasVoted ? 1 : -1) } : s,
            ),
          )
        })
    },
    [online, userId, voted],
  )

  const onForked = useCallback((created: Snippet) => {
    setSnippets((prev) => [created, ...prev])
    setForking(null)
    requestAnimationFrame(() => {
      cardRefs.current[0]?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || snippets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index))
          }
        }
      },
      { root: scroller, threshold: 0.6 },
    )
    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [snippets.length])

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(snippets.length - 1, idx))
      cardRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' })
    },
    [snippets.length],
  )

  useEffect(() => {
    if (forking || snippets.length === 0) return
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
  }, [active, forking, goTo, snippets, toggleVote])

  return (
    <div className="feed-wrap">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✨</span>
          <span className="brand-name">Snippet Showcase</span>
          {!loading && !online && (
            <span className="offline-badge" title="API unreachable — showing bundled snippets, edits won't persist">
              offline
            </span>
          )}
        </div>
        <nav className="progress" aria-label="Feed progress">
          {snippets.slice(0, 12).map((s, i) => (
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

      {loading ? (
        <div className="loader">
          <span className="spinner big" aria-hidden />
          <p>Loading the feed…</p>
        </div>
      ) : (
        <div className="scroller" ref={scrollerRef}>
          {snippets.map((snippet, i) => (
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
                votes={snippet.votes}
                hasVoted={voted.has(snippet.id)}
                onVote={() => toggleVote(snippet.id)}
                onFork={() => setForking(snippet)}
              />
            </div>
          ))}
        </div>
      )}

      {forking && (
        <ForkEditor
          snippet={forking}
          online={online}
          onForked={onForked}
          onClose={() => setForking(null)}
        />
      )}
    </div>
  )
}
