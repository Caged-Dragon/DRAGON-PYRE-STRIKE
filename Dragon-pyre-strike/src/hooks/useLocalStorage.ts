import { useEffect, useState } from 'react'

const PREFIX = 'dracopyre:'
const SAME_TAB_EVENT = 'dracopyre:ls'

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Syncs React state with localStorage under a "dracopyre:" namespace.
 * Fails silently if storage is unavailable (private browsing, quota, SSR) —
 * the app keeps working, it just won't persist between visits.
 *
 * Every instance of the same key stays in sync — across tabs (the native
 * `storage` event) and within the same tab (a small custom event), so a
 * cloud sync that updates favorites is reflected instantly in the header
 * badge, the cards and the Favorites page.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readValue(key, fallback))

  useEffect(() => {
    try {
      const next = JSON.stringify(value)
      if (window.localStorage.getItem(PREFIX + key) !== next) {
        window.localStorage.setItem(PREFIX + key, next)
        window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: key }))
      }
    } catch {
      /* storage unavailable — no-op */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  useEffect(() => {
    function resync() {
      let raw: string | null = null
      try {
        raw = window.localStorage.getItem(PREFIX + key)
      } catch {
        return
      }
      if (raw === null) return
      setValue((prev) => (JSON.stringify(prev) === raw ? prev : readValue(key, fallback)))
    }
    function onStorage(e: StorageEvent) {
      if (e.key === PREFIX + key) resync()
    }
    function onSameTab(e: Event) {
      if ((e as CustomEvent<string>).detail === key) resync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(SAME_TAB_EVENT, onSameTab)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SAME_TAB_EVENT, onSameTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue] as const
}
