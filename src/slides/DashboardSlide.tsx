import { useApi } from "../useApi"
import { BarChart, trendBars, trendSummary } from "./BarChart"

interface Fb {
  mock?: boolean
  daily?: { date: string; count: number }[]
}
interface Delivery {
  iterations: { title: string; startDate: string; done: number; total: number; current: boolean }[]
}

export function DashboardSlide() {
  const fb = useApi<Fb>("/api/feedback")
  const dl = useApi<Delivery>("/api/delivery")
  const daily = fb.data?.daily ?? []
  const { total: total30, peak } = trendSummary(daily)
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
            bars={trendBars(daily)}
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
