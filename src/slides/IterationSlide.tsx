import { useApi } from "../useApi"

interface Iteration {
  iteration: { title: string; startDate: string; endDate: string; dayNumber: number; totalDays: number } | null
  counts: { name: string; count: number }[]
  total: number
}

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" })

export function IterationSlide() {
  const { data, error } = useApi<Iteration>("/api/iteration")
  if (!data) return <h1>{error ? "Iteration data is unavailable." : "Loading."}</h1>
  if (!data.iteration) return <h1>No iteration is running at the moment.</h1>

  const { iteration, counts, total } = data
  const done = counts.find((c) => c.name === "Done")?.count ?? 0
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <>
      <div>
        <div className="tag">Delivery</div>
        <h1>{iteration.title}</h1>
        <div className="dim sub">
          {fmt(iteration.startDate)} to {fmt(iteration.endDate)} · day {iteration.dayNumber} of {iteration.totalDays}
        </div>
      </div>
      <div className="tiles">
        {counts.map((c) => (
          <div key={c.name} className={`card tile ${c.name === "Done" ? "good" : ""}`}>
            <b>{c.count}</b>
            {c.name}
          </div>
        ))}
      </div>
      <section className="card">
        <h2>{pct}% done · {done} of {total} items</h2>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      </section>
    </>
  )
}
