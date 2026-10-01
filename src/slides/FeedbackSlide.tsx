import { useEffect, useState } from "react"
import { useApi } from "../useApi"

interface Fb {
  mock?: boolean
  totalResponses: number
  avgListened: number
  avgReceived: number
  avgImproved: number
  comments: string[]
}

export function FeedbackSlide() {
  const { data, error } = useApi<Fb>("/api/feedback")
  const [c, setC] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setC((n) => n + 1), 7000)
    return () => clearInterval(id)
  }, [])
  if (!data) return <h1>{error ? "Feedback unavailable" : "Loading..."}</h1>
  const comment = data.comments[c % Math.max(data.comments.length, 1)]
  return (
    <>
      <h1>Client feedback{data.mock && <span className="dim"> · sample data</span>}</h1>
      <div className="tiles">
        <div className="tile"><b>{data.totalResponses}</b>responses</div>
        <div className="tile"><b>{data.avgListened.toFixed(1)}</b>felt listened to</div>
        <div className="tile"><b>{data.avgReceived.toFixed(1)}</b>received service</div>
        <div className="tile"><b>{data.avgImproved.toFixed(1)}</b>situation improved</div>
      </div>
      {comment && <blockquote key={c} className="quote">“{comment}”</blockquote>}
    </>
  )
}
