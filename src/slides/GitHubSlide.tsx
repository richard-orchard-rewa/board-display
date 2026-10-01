import { useApi } from "../useApi"

interface Gh {
  repo: string
  openIssues: number
  openPulls: number
  pulls: { number: number; title: string; author: string; draft: boolean }[]
  commits: { sha: string; message: string; author: string; date: string }[]
  runs: { name: string; status: string; conclusion: string | null; branch: string }[]
}

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 36e5)
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

// Brand rule: no emoji. Commit/PR titles often start with one, so strip them.
const plain = (s: string) => s.replace(/\p{Extended_Pictographic}️?\s*/gu, "").trim()

export function GitHubSlide() {
  const { data, error } = useApi<Gh>("/api/github")
  if (!data) return <h1>{error ? "GitHub is unavailable." : "Loading."}</h1>
  const latest = data.runs[0]
  const ok = latest?.conclusion === "success"
  return (
    <>
      <div>
        <div className="tag">Development</div>
        <h1>{data.repo.split("/")[1]}</h1>
      </div>
      <div className="tiles">
        <div className="card tile"><b>{data.openPulls}</b>open pull requests</div>
        <div className="card tile"><b>{data.openIssues}</b>open issues</div>
        <div className={`card tile ${ok ? "good" : "bad"}`}>
          <b>{latest ? (latest.conclusion ?? latest.status) : "-"}</b>latest build
        </div>
      </div>
      <div className="cols">
        <section className="card">
          <h2>Recent commits</h2>
          <ul className="list">
            {data.commits.slice(0, 4).map((c) => (
              <li key={c.sha}>{plain(c.message)} <span className="dim">· {c.author} · {ago(c.date)}</span></li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Open pull requests</h2>
          <ul className="list">
            {data.pulls.length === 0 && <li className="dim">None open.</li>}
            {data.pulls.slice(0, 4).map((p) => (
              <li key={p.number}>#{p.number} {plain(p.title)} <span className="dim">· {p.author}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
