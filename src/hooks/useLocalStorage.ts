import { useCallback, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next =
          typeof value === 'function'
            ? (value as (p: T) => T)(prev)
            : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore quota / private mode errors */
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
