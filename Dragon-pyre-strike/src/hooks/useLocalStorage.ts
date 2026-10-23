import { useEffect, useState } from 'react'
import { store } from '@/dps'

const PREFIX = 'dracopyre:'
const SAME_TAB_EVENT = 'dracopyre:ls'

function readValue<T>(key: string, fallback: T): T {
  try {
    const raw = store.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Same API the hub always used, now backed by the shared realm `store`:
 * guests keep values in memory only (gone on refresh); signed-in players have them saved to their account.
 * Every instance of a key stays in sync within the page.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readValue(key, fallback))

  useEffect(() => {
    const next = JSON.stringify(value)
    if (store.getItem(PREFIX + key) !== next) {
      store.setItem(PREFIX + key, next)
      window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: key }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  useEffect(() => {
    function onSameTab(e: Event) {
      if ((e as CustomEvent<string>).detail !== key) return
      const raw = store.getItem(PREFIX + key)
      if (raw === null) return
      setValue((prev) => (JSON.stringify(prev) === raw ? prev : readValue(key, fallback)))
    }
    window.addEventListener(SAME_TAB_EVENT, onSameTab)
    return () => window.removeEventListener(SAME_TAB_EVENT, onSameTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue] as const
}
