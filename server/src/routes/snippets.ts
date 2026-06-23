import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  createFork,
  getSnippet,
  listSnippets,
  toggleVote,
  votesByUser,
} from '../db.js'

export const snippetsRouter = Router()

const userIdSchema = z.string().min(1).max(64)

snippetsRouter.get('/snippets', (req, res) => {
  const snippets = listSnippets()
  const userId = req.query.userId
  const votedIds =
    typeof userId === 'string' && userId ? votesByUser(userId) : []
  res.json({ snippets, votedIds })
})

snippetsRouter.get('/snippets/:id', (req, res) => {
  const snippet = getSnippet(req.params.id)
  if (!snippet) {
    res.status(404).json({ error: 'Snippet not found' })
    return
  }
  res.json({ snippet })
})

const voteSchema = z.object({ userId: userIdSchema })

snippetsRouter.post('/snippets/:id/vote', (req, res) => {
  const parsed = voteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'userId is required' })
    return
  }
  const result = toggleVote(req.params.id, parsed.data.userId)
  if (!result) {
    res.status(404).json({ error: 'Snippet not found' })
    return
  }
  res.json(result)
})

const forkSchema = z.object({
  title: z.string().min(1).max(120),
  code: z.string().min(1).max(20000),
  author: z.string().min(1).max(64).optional(),
})

snippetsRouter.post('/snippets/:id/fork', (req, res) => {
  const parsed = forkSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'title and code are required' })
    return
  }
  const snippet = createFork(
    {
      parentId: req.params.id,
      title: parsed.data.title,
      code: parsed.data.code,
      author: parsed.data.author?.trim() || '@you',
    },
    nanoid(10),
  )
  if (!snippet) {
    res.status(404).json({ error: 'Parent snippet not found' })
    return
  }
  res.status(201).json({ snippet })
})
