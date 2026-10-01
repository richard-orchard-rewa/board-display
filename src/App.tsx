import { useEffect, useState } from "react"
import { slides } from "./slides"
import logo from "./brand/rawa-wordmark-white.svg"

export function App() {
  const [i, setI] = useState(0)
  const slide = slides[i]

  useEffect(() => {
    const id = setTimeout(() => setI((n) => (n + 1) % slides.length), slide.seconds * 1000)
    return () => clearTimeout(id)
  }, [i, slide.seconds])

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
    </div>
  )
}
