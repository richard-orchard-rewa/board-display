export interface Bar {
  key: string
  value: number
  label?: string
  highlight?: boolean
}

// Plain CSS bars (not SVG) so the labels scale with the rest of the TV type.
export function BarChart({ bars, showValues }: { bars: Bar[]; showValues: boolean }) {
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

export interface DailyCount {
  date: string
  count: number
}

// Responses-per-day bars; only the first, middle and last days are labelled.
export function trendBars(daily: DailyCount[]): Bar[] {
  return daily.map((d, i) => ({
    key: d.date,
    value: d.count,
    label: i === 0 || i === daily.length - 1 || i === Math.floor(daily.length / 2) ? short(d.date) : "",
  }))
}

export function trendSummary(daily: DailyCount[]) {
  return {
    total: daily.reduce((a, d) => a + d.count, 0),
    peak: Math.max(0, ...daily.map((d) => d.count)),
  }
}
