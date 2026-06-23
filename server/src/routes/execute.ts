import { Router } from 'express'
import { z } from 'zod'
import { execute } from '../exec/index.js'
import type { Language } from '../types.js'

export const executeRouter = Router()

const executeSchema = z.object({
  language: z.enum([
    'javascript',
    'typescript',
    'python',
    'css',
    'bash',
    'sql',
  ]),
  code: z.string().min(1).max(20000),
})

executeRouter.post('/execute', async (req, res) => {
  const parsed = executeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'language and code are required' })
    return
  }
  const { language, code } = parsed.data
  const result = await execute(language as Language, code)
  res.json(result)
})
