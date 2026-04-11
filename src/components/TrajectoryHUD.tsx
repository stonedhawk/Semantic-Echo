import { ArrowDownRight, ArrowUpRight, Gauge, Minus } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { TrajectoryAnalytics } from '../features/trajectory/graphify'

type TrajectoryHUDProps = {
  trajectory: TrajectoryAnalytics
}

function formatDelta(value: number | null) {
  if (value === null) {
    return 'n/a'
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

export function TrajectoryHUD({ trajectory }: TrajectoryHUDProps) {
  const Icon =
    trajectory.trend === 'converging'
      ? ArrowDownRight
      : trajectory.trend === 'diverging'
        ? ArrowUpRight
        : Minus

  return (
    <aside className="panel trajectory-hud">
      <div className="trajectory-hud__header">
        <div>
          <p className="eyebrow">Graphify trajectory HUD</p>
          <h2>Signal plot</h2>
        </div>
        <div className="metric-chip">
          <Gauge size={15} />
          <span>Best {trajectory.bestScore}</span>
        </div>
      </div>

      <div
        className="graphify-plot"
        role="img"
        aria-label="Trajectory plot of guess scores from oldest to newest"
      >
        {trajectory.samples.length === 0 ? (
          <div className="graphify-plot__empty">Awaiting score samples</div>
        ) : (
          trajectory.samples.map((sample) => (
            <div
              key={`${sample.index}-${sample.score}`}
              className={`graphify-plot__bar graphify-plot__bar--${sample.direction}`}
              style={{ '--bar-height': sample.normalizedHeight } as CSSProperties}
              title={`${sample.label}: ${sample.score}`}
            />
          ))
        )}
      </div>

      <div className="trajectory-metrics">
        <div>
          <span>Current distance</span>
          <strong>
            {trajectory.currentDistance === null
              ? 'n/a'
              : trajectory.currentDistance.toFixed(1)}
          </strong>
        </div>
        <div>
          <span>Latest delta</span>
          <strong>{formatDelta(trajectory.latestDelta)}</strong>
        </div>
        <div>
          <span>Previous delta</span>
          <strong>{formatDelta(trajectory.previousDelta)}</strong>
        </div>
      </div>

      <div className={`trajectory-trend trajectory-trend--${trajectory.trend}`}>
        <Icon size={16} />
        <span>
          {trajectory.trend === 'converging' &&
            'Trajectory is converging toward the target.'}
          {trajectory.trend === 'diverging' &&
            'Latest probe drifted farther from the target.'}
          {trajectory.trend === 'steady' &&
            'Trajectory is flat. Try a new semantic branch.'}
          {trajectory.trend === 'insufficient-data' &&
            'Need at least two scored guesses to assess movement.'}
        </span>
      </div>
    </aside>
  )
}
