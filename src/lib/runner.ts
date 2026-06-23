export interface LogLine {
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
}

const TIMEOUT_MS = 2000

/**
 * Runs untrusted JavaScript inside a sandboxed, cross-origin iframe and
 * collects everything written to the console. The iframe has no DOM access to
 * the host page and is torn down after a hard timeout to stop infinite loops.
 */
export function runJavaScript(code: string): Promise<LogLine[]> {
  return new Promise((resolve) => {
    const logs: LogLine[] = []
    const token = Math.random().toString(36).slice(2)

    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'

    let settled = false
    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      iframe.remove()
    }
    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(logs)
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.token !== token) return
      if (data.type === 'log') {
        logs.push({ level: data.level, text: data.text })
      } else if (data.type === 'done') {
        // Give async microtasks/timeouts a brief window to flush.
        setTimeout(finish, 60)
      }
    }
    window.addEventListener('message', onMessage)

    const timer = setTimeout(() => {
      logs.push({
        level: 'error',
        text: `Execution timed out after ${TIMEOUT_MS}ms (possible infinite loop).`,
      })
      finish()
    }, TIMEOUT_MS)

    const html = buildSandboxHtml(code, token)
    iframe.srcdoc = html
    document.body.appendChild(iframe)
  })
}

function buildSandboxHtml(userCode: string, token: string): string {
  const runtime = `
    const TOKEN = ${JSON.stringify(token)};
    const post = (type, payload) =>
      parent.postMessage(Object.assign({ token: TOKEN, type }, payload), '*');

    const format = (v) => {
      if (typeof v === 'string') return v;
      if (v instanceof Error) return v.name + ': ' + v.message;
      try {
        return JSON.stringify(v, (_k, val) =>
          typeof val === 'function' ? '[Function ' + (val.name || 'anonymous') + ']'
          : typeof val === 'bigint' ? val.toString() + 'n'
          : typeof val === 'undefined' ? '__undefined__'
          : val,
        2)?.replace(/"__undefined__"/g, 'undefined') ?? String(v);
      } catch (e) {
        return String(v);
      }
    };

    const send = (level) => (...args) =>
      post('log', { level, text: args.map(format).join(' ') });

    console.log = send('log');
    console.info = send('info');
    console.warn = send('warn');
    console.error = send('error');

    window.onerror = (msg) => { post('log', { level: 'error', text: String(msg) }); };

    (async () => {
      try {
        await (async () => {
          ${userCode}
        })();
      } catch (err) {
        post('log', { level: 'error', text: (err && err.stack) ? err.message : String(err) });
      } finally {
        post('done', {});
      }
    })();
  `

  const close = '<' + '/script>'
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>${runtime}${close}</body></html>`
}
