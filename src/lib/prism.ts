import Prism from 'prismjs'

// Language definitions. Order matters: some languages extend others.
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'

import type { Language } from '../types'

const aliasToGrammar: Record<Language, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  css: 'css',
  bash: 'bash',
  sql: 'sql',
}

export function highlight(code: string, language: Language): string {
  const grammarName = aliasToGrammar[language]
  const grammar = Prism.languages[grammarName]
  if (!grammar) return escapeHtml(code)
  return Prism.highlight(code, grammar, grammarName)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default Prism
