import { useApi } from "../useApi"

interface Fb {
  mock?: boolean
  dexCoverage?: number | null
  rollout?: { locations: number; programs: number } | null
}

export function SuccessMetricsSlide() {
  const { data } = useApi<Fb>("/api/feedback")
  const rollout = data?.rollout
  return (
    <>
      <div>
        <div className="tag">Success{data?.mock && " · sample data"}</div>
        <h1>Feedback Success Metrics</h1>
      </div>
      <div className="tiles">
        <div className="card tile"><b>10 mins</b>estimated time saved per client, per location</div>
        {data?.dexCoverage != null && (
          <div className="card tile"><b>{Math.round(data.dexCoverage * 100)}%</b>overall response rate (DEX, 30 days)</div>
        )}
      </div>
      <div className="tiles">
        {rollout && (
          <>
            <div className="card tile"><b>{rollout.locations}</b>locations rolled out</div>
            <div className="card tile"><b>{rollout.programs}</b>programs rolled out</div>
          </>
        )}
        <div className="card tile"><b>11</b>PDF forms deprecated</div>
      </div>
    </>
  )
}
