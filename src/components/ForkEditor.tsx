import { useCallback, useEffect, useState } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight } from '../lib/prism'
import { runJavaScript } from '../lib/runner'
import { executeCode, forkSnippet } from '../lib/api'
import type { LogLine, Snippet } from '../types'

interface Props {
  snippet: Snippet
  online: boolean
  onForked: (created: Snippet) => void
  onClose: () => void
}

const isCss = (s: Snippet) => s.language === 'css'

export function ForkEditor({ snippet, online, onForked, onClose }: Props) {
  const [code, setCode] = useState(snippet.code)
  const [title, setTitle] = useState(`${snippet.title} (fork)`)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!snippet.runnable) return
    setRunning(true)
    setHasRun(true)
    try {
      if (online) {
        const result = await executeCode(snippet.language, code)
        setLogs(result.logs)
      } else if (snippet.language === 'javascript') {
        setLogs(await runJavaScript(code))
      } else {
        setLogs([
          {
            level: 'warn',
            text: `Running ${snippet.language} requires the backend, which is offline.`,
          },
        ])
      }
    } catch (err) {
      setLogs([{ level: 'error', text: (err as Error).message }])
    } finally {
      setRunning(false)
    }
  }, [code, online, snippet.language, snippet.runnable])

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

  const save = useCallback(async () => {
    if (!online) {
      setSaveError('Saving forks requires the backend.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const created = await forkSnippet(snippet.id, {
        title: title.trim() || `${snippet.title} (fork)`,
        code,
      })
      onForked(created)
    } catch (err) {
      setSaveError((err as Error).message)
      setSaving(false)
    }
  }, [code, online, onForked, snippet.id, snippet.title, title])

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

  const showConsole = snippet.runnable
  const showPreview = isCss(snippet)
  const hasSidePane = showConsole || showPreview

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
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
              <h2>Forking: {snippet.title}</h2>
              <p>
                <span className={`lang-pill lang-${snippet.language}`}>
                  {snippet.language}
                </span>
                <span className="hint">
                  {showConsole
                    ? 'Edit & run on the server — ⌘/Ctrl + Enter'
                    : showPreview
                      ? 'Edit CSS — preview updates live'
                      : 'Edit freely'}
                </span>
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close editor">
            ✕
          </button>
        </header>

        <div className={`editor-grid ${hasSidePane ? '' : 'editor-grid--solo'}`}>
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

          {showConsole && (
            <div className="console-pane">
              <div className="pane-label">
                console
                {online ? (
                  <span className="pane-tag">server</span>
                ) : (
                  <span className="pane-tag pane-tag--warn">offline</span>
                )}
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

          {showPreview && (
            <div className="console-pane">
              <div className="pane-label">
                preview<span className="pane-tag">live</span>
              </div>
              <iframe
                title="CSS preview"
                className="css-preview"
                sandbox=""
                srcDoc={cssPreviewDoc(code)}
              />
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

          <div className="save-group">
            {saveError && <span className="save-error">{saveError}</span>}
            <input
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Fork title"
              placeholder="Fork title"
            />
            <button
              className="ghost-btn save-btn"
              onClick={() => void save()}
              disabled={saving || !online}
              title={online ? 'Save this fork to the feed' : 'Backend offline'}
            >
              {saving ? 'Saving…' : '⑂ Save fork'}
            </button>
          </div>

          {showConsole && (
            <button className="run-btn" onClick={() => void run()} disabled={running}>
              {running ? 'Running…' : '▶ Run'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function cssPreviewDoc(css: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, sans-serif; color: #fff;
      background:
        radial-gradient(120% 120% at 0% 0%, #6d5cff55, transparent 60%),
        radial-gradient(120% 120% at 100% 100%, #ff5c8a55, transparent 60%),
        #14141f;
      padding: 24px;
    }
    .demo, .glass, .card { max-width: 320px; }
    ${css}
  </style></head><body>
    <div class="glass demo card">
      <h3 style="margin:0 0 8px">Live preview</h3>
      <p style="margin:0;opacity:.85">Your CSS is applied to <code>.glass</code>, <code>.card</code>, and <code>.demo</code>.</p>
    </div>
  </body></html>`
}

function extFor(language: Snippet['language']): string {
  switch (language) {
    case 'javascript':
      return 'mjs'
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
