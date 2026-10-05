import { useApi } from "../useApi"

interface Fb {
  mock?: boolean
  daily?: { date: string; count: number }[]
}
interface Delivery {
  iterations: { title: string; startDate: string; done: number; total: number; current: boolean }[]
}

interface Bar {
  key: string
  value: number
  label?: string
  highlight?: boolean
}

// Plain CSS bars (not SVG) so the labels scale with the rest of the TV type.
function BarChart({ bars, showValues }: { bars: Bar[]; showValues: boolean }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className={`chart ${showValues ? "" : "dense"}`} role="img">
      {bars.map((b) => (
        <div key={b.key} className="col">
          {showValues && <span className="val">{b.value}</span>}
          <div className="stem">
            <div className={`fill ${b.highlight ? "hi" : ""}`} style={{ height: `${(b.value / max) * 100}%` }} />
          </div>
          <span className="lbl">{b.label ?? ""}</span>
        </div>
      ))}
    </div>
  )
}

const short = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" })

export function DashboardSlide() {
  const fb = useApi<Fb>("/api/feedback")
  const dl = useApi<Delivery>("/api/delivery")
  const daily = fb.data?.daily ?? []
  const total30 = daily.reduce((a, d) => a + d.count, 0)
  const peak = Math.max(0, ...daily.map((d) => d.count))
  const iterations = dl.data?.iterations ?? []

  return (
    <>
      <div>
        <div className="tag">Dashboard{fb.data?.mock && " · feedback is sample data"}</div>
        <h1>How we are tracking</h1>
      </div>
      <div className="cols charts">
        <section className="card">
          <h2>Feedback responses per day</h2>
          <div className="dim sub">
            {daily.length ? `Last 30 days · ${total30} responses · busiest day ${peak}` : fb.error ? "Unavailable." : "Loading."}
          </div>
          <BarChart
            showValues={false}
            bars={daily.map((d, i) => ({
              key: d.date,
              value: d.count,
              label: i === 0 || i === daily.length - 1 || i === 14 ? short(d.date) : "",
            }))}
          />
        </section>
        <section className="card">
          <h2>Items done per iteration</h2>
          <div className="dim sub">
            {iterations.length ? "Latest iteration still in progress" : dl.error ? "Unavailable." : "Loading."}
          </div>
          <BarChart
            showValues
            bars={iterations.map((it) => ({
              key: it.title,
              value: it.done,
              label: it.title.replace(/^Iteration\s*/i, "#"),
              highlight: it.current,
            }))}
          />
        </section>
      </div>
    </>
  )
}
