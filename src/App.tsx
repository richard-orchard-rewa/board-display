import { useEffect, useState } from "react"
import { slides } from "./slides"
import { useLastFresh } from "./useApi"
import logo from "./brand/rawa-wordmark-white.svg"

const STALE_AFTER_MS = 5 * 60 * 1000
const time = (t: number) => new Date(t).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })

function LastUpdated() {
  const last = useLastFresh()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!last) return null
  const stale = now - last > STALE_AFTER_MS
  return (
    <div className={stale ? "updated stale" : "updated"}>
      {stale ? `Offline. Showing data from ${time(last)}` : `Updated ${time(last)}`}
    </div>
  )
}

export function App() {
  const [i, setI] = useState(0)
  const slide = slides[i]

  useEffect(() => {
    const id = setTimeout(() => setI((n) => (n + 1) % slides.length), slide.seconds * 1000)
    return () => clearTimeout(id)
  }, [i, slide.seconds])

  // Arrow keys step through slides; the auto-advance timer restarts on each change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key === "ArrowRight") setI((n) => (n + 1) % slides.length)
      else if (e.key === "ArrowLeft") setI((n) => (n - 1 + slides.length) % slides.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Reload hourly so a long-running kiosk picks up new builds and recovers from leaks.
  useEffect(() => {
    const id = setTimeout(() => location.reload(), 60 * 60 * 1000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="stage">
      <img className="logo" src={logo} alt="Relationships Australia WA" />
      <main key={slide.id} className="slide">
        {slide.render()}
      </main>
      <div className="progress" key={`p-${slide.id}`} style={{ animationDuration: `${slide.seconds}s` }} />
      <LastUpdated />
    </div>
  )
}
