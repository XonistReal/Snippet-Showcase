import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight } from '../lib/prism'
import { runJavaScript, type LogLine } from '../lib/runner'
import type { Snippet } from '../types'

interface Props {
  snippet: Snippet
  onClose: () => void
}

export function ForkEditor({ snippet, onClose }: Props) {
  const [code, setCode] = useState(snippet.code)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const run = useCallback(async () => {
    if (!snippet.runnable) return
    setRunning(true)
    setHasRun(true)
    const result = await runJavaScript(code)
    setLogs(result)
    setRunning(false)
  }, [code, snippet.runnable])

  const reset = useCallback(() => {
    setCode(snippet.code)
    setLogs([])
    setHasRun(false)
  }, [snippet.code])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }, [code])

  // Auto-run runnable snippets once on open so there's instant feedback.
  useEffect(() => {
    if (snippet.runnable) void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, run])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Fork of ${snippet.title}`}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ ['--accent' as string]: snippet.accent }}
      >
        <header className="modal-head">
          <div className="modal-title">
            <span className="fork-icon" aria-hidden>⑂</span>
            <div>
              <h2>Forked: {snippet.title}</h2>
              <p>
                <span className={`lang-pill lang-${snippet.language}`}>
                  {snippet.language}
                </span>
                <span className="hint">
                  {snippet.runnable
                    ? 'Edit & run — ⌘/Ctrl + Enter'
                    : 'Edit freely — this language runs outside the browser'}
                </span>
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close editor">
            ✕
          </button>
        </header>

        <div className={`editor-grid ${snippet.runnable ? '' : 'editor-grid--solo'}`}>
          <div className="editor-pane">
            <div className="pane-label">editor.{extFor(snippet.language)}</div>
            <div className="editor-scroll">
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={(c) => highlight(c, snippet.language)}
                padding={16}
                textareaId="fork-editor"
                className="code-editor"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {snippet.runnable && (
            <div className="console-pane">
              <div className="pane-label">
                console
                {running && <span className="spinner" aria-hidden />}
              </div>
              <div className="console-scroll">
                {!hasRun && <p className="console-empty">Press Run to execute.</p>}
                {hasRun && logs.length === 0 && !running && (
                  <p className="console-empty">No output.</p>
                )}
                {logs.map((line, i) => (
                  <div key={i} className={`log log-${line.level}`}>
                    <span className="log-gutter" aria-hidden>
                      {line.level === 'error' ? '✕' : '›'}
                    </span>
                    <pre>{line.text}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="modal-foot">
          <button className="ghost-btn" onClick={reset}>
            ↺ Reset
          </button>
          <button className="ghost-btn" onClick={copy}>
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
          {snippet.runnable && (
            <button className="run-btn" onClick={() => void run()} disabled={running}>
              {running ? 'Running…' : '▶ Run'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function extFor(language: Snippet['language']): string {
  switch (language) {
    case 'javascript':
      return 'js'
    case 'typescript':
      return 'ts'
    case 'python':
      return 'py'
    case 'css':
      return 'css'
    case 'bash':
      return 'sh'
    case 'sql':
      return 'sql'
  }
}
