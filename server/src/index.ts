import cors from 'cors'
import express from 'express'
import { seedIfEmpty } from './db.js'
import { isNetworkIsolated } from './exec/index.js'
import { isRunnable } from './exec/languages.js'
import { executeRouter } from './routes/execute.js'
import { snippetsRouter } from './routes/snippets.js'
import type { Language } from './types.js'

const PORT = Number(process.env.PORT ?? 8787)

seedIfEmpty()

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

const ALL_LANGUAGES: Language[] = [
  'javascript',
  'typescript',
  'python',
  'css',
  'bash',
  'sql',
]

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    networkIsolated: isNetworkIsolated(),
    runnable: ALL_LANGUAGES.filter(isRunnable),
  })
})

app.use('/api', snippetsRouter)
app.use('/api', executeRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`[snippet-showcase] API listening on http://localhost:${PORT}`)
  console.log(
    `[snippet-showcase] network isolation: ${
      isNetworkIsolated() ? 'enabled (unshare -rn)' : 'unavailable'
    }`,
  )
})
