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
        <div className="card tile"><b>{data.avgListened.toFixed(1)}</b>felt listened to</div>
        <div className="card tile"><b>{data.avgReceived.toFixed(1)}</b>received the service they needed</div>
        <div className="card tile"><b>{data.avgImproved.toFixed(1)}</b>situation improved</div>
      </div>
      {comment && <blockquote key={c} className="quote">“{comment}”</blockquote>}
    </>
  )
}
