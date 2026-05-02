import { useState, useCallback } from 'react'

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback((newValue) => {
    setValue(prev => {
      const next = typeof newValue === 'function' ? newValue(prev) : newValue
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [key])

  return [value, setStoredValue]
}
