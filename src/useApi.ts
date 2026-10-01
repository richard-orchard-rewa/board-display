import { useEffect, useState } from "react"

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
