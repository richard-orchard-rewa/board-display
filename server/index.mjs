// Tiny API for the display: fetches + caches GitHub and feedback data so tokens
// never reach the browser and the TV never hits upstream APIs directly.
import http from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const PORT = Number(process.env.PORT ?? 3001)
const REPO = process.env.GITHUB_REPO ?? "Relationships-Australia-WA/feedback"
const PROJECT_ORG = process.env.PROJECT_ORG ?? "Relationships-Australia-WA"
const PROJECT_NUMBER = Number(process.env.PROJECT_NUMBER ?? 1)
const TTL_MS = 2 * 60 * 1000
const DIST = fileURLToPath(new URL("../dist", import.meta.url))

const cache = new Map()
async function cached(key, load) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value
  try {
    const value = await load()
    cache.set(key, { at: Date.now(), value })
    return value
  } catch (err) {
    // Serve stale data rather than blanking the TV on a transient failure.
    if (hit) return hit.value
    throw err
  }
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "board-display",
      ...(process.env.GITHUB_TOKEN && { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${path} -> ${res.status}`)
  return res.json()
}

async function ghGraphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "board-display",
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GitHub GraphQL -> ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(`GitHub GraphQL: ${json.errors[0].message}`)
  return json.data
}

// Counts of GitHub Project items by Status for the current Iteration. Counts
// only: no titles, so nothing sensitive reaches the TV. Needs a token with read:project.
const STATUSES = ["Backlog", "Ready", "In progress", "In review", "Done"]
const ITEMS_QUERY = `query($org:String!, $number:Int!, $after:String) {
  organization(login:$org) { projectV2(number:$number) {
    field: field(name:"Iteration") { ... on ProjectV2IterationField {
      configuration { iterations { title startDate duration } } } }
    items(first:100, after:$after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        status: fieldValueByName(name:"Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
        iteration: fieldValueByName(name:"Iteration") { ... on ProjectV2ItemFieldIterationValue { title } }
      }
    }
  } }
}`

const loadIteration = () =>
  cached("iteration", async () => {
    let after = null
    let iterations = []
    const items = []
    do {
      const { organization } = await ghGraphql(ITEMS_QUERY, { org: PROJECT_ORG, number: PROJECT_NUMBER, after })
      const project = organization.projectV2
      iterations = project.field.configuration.iterations
      items.push(...project.items.nodes)
      after = project.items.pageInfo.hasNextPage ? project.items.pageInfo.endCursor : null
    } while (after)

    // Dates are calendar dates; compare in the office's timezone.
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(new Date())
    const day = (d) => Date.parse(`${d}T00:00:00Z`)
    const current = iterations.find(
      (i) => day(i.startDate) <= day(today) && day(today) < day(i.startDate) + i.duration * 864e5,
    )
    if (!current) return { iteration: null, updatedAt: new Date().toISOString() }

    const counts = Object.fromEntries(STATUSES.map((name) => [name, 0]))
    for (const item of items) {
      if (item.iteration?.title !== current.title) continue
      const name = item.status?.name ?? "Backlog"
      counts[name] = (counts[name] ?? 0) + 1
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return {
      iteration: {
        title: current.title,
        startDate: current.startDate,
        endDate: new Date(day(current.startDate) + (current.duration - 1) * 864e5).toISOString().slice(0, 10),
        dayNumber: Math.floor((day(today) - day(current.startDate)) / 864e5) + 1,
        totalDays: current.duration,
      },
      counts: STATUSES.map((name) => ({ name, count: counts[name] })),
      total,
      updatedAt: new Date().toISOString(),
    }
  })

const loadGithub = () =>
  cached("github", async () => {
    const [repo, pulls, commits, runs] = await Promise.all([
      gh(`/repos/${REPO}`),
      gh(`/repos/${REPO}/pulls?state=open&per_page=10`),
      gh(`/repos/${REPO}/commits?per_page=6`),
      gh(`/repos/${REPO}/actions/runs?per_page=5`),
    ])
    return {
      repo: REPO,
      // open_issues_count includes PRs
      openIssues: repo.open_issues_count - pulls.length,
      openPulls: pulls.length,
      pulls: pulls.slice(0, 5).map((p) => ({ number: p.number, title: p.title, author: p.user.login, draft: p.draft })),
      commits: commits.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
      })),
      runs: runs.workflow_runs.map((r) => ({
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        date: r.updated_at,
      })),
      updatedAt: new Date().toISOString(),
    }
  })

// Feedback comes from feedback-dash, which sits behind Entra ID (Easy Auth).
// "mock" returns sample data; "live" needs an app-only token + allow-list
// entry on that app (see README) and is not implemented yet.
const loadFeedback = () =>
  cached("feedback", async () => {
    if (process.env.FEEDBACK_MODE === "live") throw new Error("FEEDBACK_MODE=live not implemented yet")
    return {
      mock: true,
      totalResponses: 412,
      avgListened: 4.6,
      avgReceived: 4.4,
      avgImproved: 4.1,
      comments: [
        "I felt really heard and not judged.",
        "Booking was easy and the reminder text was helpful.",
        "My counsellor gave me practical tools I still use.",
      ],
      updatedAt: new Date().toISOString(),
    }
  })

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" }

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://x")
    try {
      const loaders = { "/api/github": loadGithub, "/api/feedback": loadFeedback, "/api/iteration": loadIteration }
      if (loaders[url.pathname]) {
        const data = await loaders[url.pathname]()
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(data))
        return
      }
      // Production: serve the built client.
      const rel = url.pathname === "/" ? "/index.html" : url.pathname
      const file = normalize(join(DIST, rel))
      if (!file.startsWith(DIST)) throw new Error("forbidden")
      const body = await readFile(file)
      res.writeHead(200, { "content-type": MIME[extname(rel)] ?? "application/octet-stream" }).end(body)
    } catch (err) {
      const isApi = url.pathname.startsWith("/api/")
      res.writeHead(isApi ? 502 : 404).end(isApi ? String(err.message) : "Not found")
    }
  })
  .listen(PORT, () => console.log(`board-display on http://localhost:${PORT}`))
