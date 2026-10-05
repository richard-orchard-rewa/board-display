import { useEffect, useState } from "react"
import { useApi } from "../useApi"

interface Fb {
  mock?: boolean
  totalResponses: number
  avgListened: number | null
  avgReceived: number | null
  avgImproved: number | null
  comments: string[]
}

const score = (n: number | null) => (n === null ? "-" : n.toFixed(1))

export function FeedbackSlide() {
  const { data, error } = useApi<Fb>("/api/feedback")
  const [c, setC] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setC((n) => n + 1), 7000)
    return () => clearInterval(id)
  }, [])
  if (!data) return <h1>{error ? "Feedback is unavailable." : "Loading."}</h1>
  const comment = data.comments[c % Math.max(data.comments.length, 1)]
  return (
    <>
      <div>
        <div className="tag">Client feedback{data.mock && " · sample data"}</div>
        <h1>What clients are telling us</h1>
      </div>
      <div className="tiles">
        <div className="card tile"><b>{data.totalResponses}</b>responses</div>
        <div className="card tile"><b>{score(data.avgListened)}</b>felt listened to (30 days)</div>
        <div className="card tile"><b>{score(data.avgReceived)}</b>received the service they needed (30 days)</div>
        <div className="card tile"><b>{score(data.avgImproved)}</b>situation improved (30 days)</div>
      </div>
      {comment && <blockquote key={c} className="quote">“{comment}”</blockquote>}
    </>
  )
}
