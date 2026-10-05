export interface Bar {
  key: string
  value: number
  label?: string
  highlight?: boolean
}

// Round the top of the axis up to a tidy number with at most 4 steps (0, 10, 20, 30).
function niceScale(max: number) {
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find((s) => max / s <= 4) ?? 1000
  const top = Math.max(step, Math.ceil(max / step) * step)
  return { top, ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step) }
}

// Plain CSS bars (not SVG) so the labels scale with the rest of the TV type.
// Charts without per-bar values (the trend) get a labelled y-axis with gridlines.
export function BarChart({ bars, showValues }: { bars: Bar[]; showValues: boolean }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  const scale = showValues ? null : niceScale(max)
  const top = scale?.top ?? max
  return (
    <div className="chart-wrap">
      {scale && (
        <div className="yaxis" aria-hidden="true">
          {scale.ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>{t}</span>
          ))}
        </div>
      )}
      <div className="plot">
        {scale && (
          <div className="grid" aria-hidden="true">
            {scale.ticks.map((t) => (
              <i key={t} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}
          </div>
        )}
        <div className={`chart ${showValues ? "" : "dense"}`} role="img">
          {bars.map((b) => (
            <div key={b.key} className="col">
              {showValues && <span className="val">{b.value}</span>}
              <div className="stem">
                <div className={`fill ${b.highlight ? "hi" : ""}`} style={{ height: `${(b.value / top) * 100}%` }} />
              </div>
              <span className="lbl">{b.label ?? ""}</span>
            </div>
          ))}
        </div>
      </div>
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
