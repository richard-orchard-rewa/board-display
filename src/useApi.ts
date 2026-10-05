import { useEffect, useState, useSyncExternalStore } from "react"

// Time of the last successful *live* fetch (not one the service worker served
// from cache). Persisted so the "last updated" indicator survives the hourly reload.
const KEY = "board-display:lastFresh"
const listeners = new Set<() => void>()
let lastFresh = (() => {
  try {
    return Number(localStorage.getItem(KEY)) || 0
  } catch {
    return 0
  }
})()

function markFresh() {
  lastFresh = Date.now()
  try {
    localStorage.setItem(KEY, String(lastFresh))
  } catch {
    // storage unavailable: indicator just won't survive a reload
  }
  listeners.forEach((l) => l())
}

export function useLastFresh() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => void listeners.delete(cb)),
    () => lastFresh,
  )
}

// Polls an API endpoint; keeps the last good value if a refresh fails so the
// TV never flashes an error for a transient blip.
export function useApi<T>(path: string, everyMs = 60_000) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(path)
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as T
        if (alive) {
          setData(json)
          setError(false)
          if (!res.headers.has("x-from-cache")) markFresh()
        }
      } catch {
        if (alive) setError(true)
      }
    }
    load()
    const id = setInterval(load, everyMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [path, everyMs])
  return { data, error }
}
