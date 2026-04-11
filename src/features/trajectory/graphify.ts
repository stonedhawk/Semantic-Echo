export type GraphifySample = {
  index: number
  score: number
  normalizedHeight: number
  direction: 'warming' | 'cooling' | 'steady'
  label: string
}

export type TrajectoryAnalytics = {
  samples: GraphifySample[]
  bestScore: number
  currentDistance: number | null
  previousDistance: number | null
  latestDelta: number | null
  previousDelta: number | null
  trend: 'converging' | 'diverging' | 'steady' | 'insufficient-data'
}

export function buildGraphifySeries(scores: number[]): TrajectoryAnalytics {
  const samples = scores
    .slice()
    .reverse()
    .map((score, index, ordered) => {
      const previous = ordered[index - 1]
      const direction =
        previous === undefined
          ? 'steady'
          : score > previous
            ? 'warming'
            : score < previous
              ? 'cooling'
              : 'steady'

      return {
        index,
        score,
        normalizedHeight: Math.max(0.08, score / 100),
        direction,
        label: `Guess ${index + 1}`,
      } satisfies GraphifySample
    })

  const latestScore = scores[0]
  const previousScore = scores[1]
  const thirdScore = scores[2]
  const currentDistance = latestScore === undefined ? null : 100 - latestScore
  const previousDistance =
    previousScore === undefined ? null : 100 - previousScore
  const thirdDistance = thirdScore === undefined ? null : 100 - thirdScore
  const latestDelta =
    currentDistance === null || previousDistance === null
      ? null
      : currentDistance - previousDistance
  const previousDelta =
    previousDistance === null || thirdDistance === null
      ? null
      : previousDistance - thirdDistance

  let trend: TrajectoryAnalytics['trend'] = 'insufficient-data'

  if (latestDelta !== null) {
    if (latestDelta < 0) {
      trend = 'converging'
    } else if (latestDelta > 0) {
      trend = 'diverging'
    } else {
      trend = 'steady'
    }
  }

  return {
    samples,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    currentDistance,
    previousDistance,
    latestDelta,
    previousDelta,
    trend,
  }
}
