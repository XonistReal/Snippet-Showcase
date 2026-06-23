import { useMemo } from 'react'
import { highlight } from '../lib/prism'
import type { Language } from '../types'

interface Props {
  code: string
  language: Language
}

export function CodeBlock({ code, language }: Props) {
  const html = useMemo(() => highlight(code, language), [code, language])
  return (
    <pre className="code-block" aria-label={`${language} code snippet`}>
      <code
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  )
}
