import type { CatalogSource } from '../lib/vectorTypes'
import { Activity, Binary, Radar } from 'lucide-react'

type TopBarProps = {
  mode: 'daily' | 'practice'
  puzzleNumber: number
  playableWordCount: number
  catalogSource: CatalogSource | null
  ready: boolean
}

function getCatalogLabel(catalogSource: CatalogSource | null) {
  switch (catalogSource) {
    case 'remote':
      return 'Live feed'
    case 'local':
      return 'Bundled pool'
    case 'embedded-fallback':
      return 'Safe fallback'
    default:
      return 'Finding pool'
  }
}

export function TopBar({
  mode,
  puzzleNumber,
  playableWordCount,
  catalogSource,
  ready,
}: TopBarProps) {
  return (
    <header className="panel top-bar">
      <div>
        <p className="eyebrow">Semantic Echo</p>
        <h1>
          {mode === 'daily'
            ? 'Guess today’s hidden word'
            : 'Practice with a new hidden word'}
        </h1>
      </div>

      <div className="top-bar__meta">
        <div className="metric-chip">
          <Radar size={15} />
          <span>{mode === 'daily' ? `Puzzle ${puzzleNumber}` : `Practice ${puzzleNumber}`}</span>
        </div>
        <div className="metric-chip">
          <Binary size={15} />
          <span>{playableWordCount} live words</span>
        </div>
        <div className="metric-chip">
          <span>{getCatalogLabel(catalogSource)}</span>
        </div>
        <div className={`metric-chip ${ready ? 'metric-chip--ready' : ''}`}>
          <Activity size={15} />
          <span>{ready ? 'Ready' : 'Loading'}</span>
        </div>
      </div>
    </header>
  )
}
