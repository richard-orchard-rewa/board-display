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

export function GitHubSlide() {
  const { data, error } = useApi<Gh>("/api/github")
  if (!data) return <h1>{error ? "GitHub unavailable" : "Loading..."}</h1>
  const latest = data.runs[0]
  const ok = latest?.conclusion === "success"
  return (
    <>
      <h1>Development · {data.repo.split("/")[1]}</h1>
      <div className="tiles">
        <div className="tile"><b>{data.openPulls}</b>open PRs</div>
        <div className="tile"><b>{data.openIssues}</b>open issues</div>
        <div className={`tile ${ok ? "good" : "bad"}`}>
          <b>{latest ? (latest.conclusion ?? latest.status) : "-"}</b>latest build
        </div>
      </div>
      <div className="cols">
        <section>
          <h2>Recent commits</h2>
          <ul className="list small">
            {data.commits.map((c) => (
              <li key={c.sha}>{c.message} <span className="dim">· {c.author} · {ago(c.date)}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Open pull requests</h2>
          <ul className="list small">
            {data.pulls.length === 0 && <li className="dim">None open</li>}
            {data.pulls.map((p) => (
              <li key={p.number}>#{p.number} {p.title} <span className="dim">· {p.author}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
