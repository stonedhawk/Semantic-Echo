import {
  Flag,
  HelpCircle,
  RotateCcw,
  SkipForward,
  Sparkles,
} from 'lucide-react'

import type { HintPayload } from '../lib/vectorTypes'

type ControlPanelProps = {
  mode: 'daily' | 'practice'
  completed: boolean
  status: string
  hintHistory: HintPayload[]
  revealedWord: string | null
  onHint: () => void
  onGiveUp: () => void
  onRestart: () => void
  onNextWord: () => void
  onReturnToDaily: () => void
}

export function ControlPanel({
  mode,
  completed,
  status,
  hintHistory,
  revealedWord,
  onHint,
  onGiveUp,
  onRestart,
  onNextWord,
  onReturnToDaily,
}: ControlPanelProps) {
  const interactionLocked = status === 'loading' || status === 'scoring'

  return (
    <section className="panel control-panel">
      <div className="control-panel__header">
        <div>
          <p className="eyebrow">Round controls</p>
          <h2>{mode === 'daily' ? 'Daily game controls' : 'Practice controls'}</h2>
        </div>
        <div className="mode-pill">{mode === 'daily' ? 'Daily mode' : 'Practice mode'}</div>
      </div>

      <div className="control-panel__actions">
        <button
          className="control-button"
          onClick={onHint}
          disabled={interactionLocked || completed || hintHistory.length >= 5}
          type="button"
        >
          <HelpCircle size={16} />
          Hint
        </button>
        <button
          className="control-button"
          onClick={onGiveUp}
          disabled={interactionLocked || completed}
          type="button"
        >
          <Flag size={16} />
          Give Up
        </button>
        <button
          className="control-button"
          onClick={onRestart}
          disabled={interactionLocked}
          type="button"
        >
          <RotateCcw size={16} />
          Restart
        </button>
        <button
          className="control-button control-button--accent"
          onClick={onNextWord}
          disabled={interactionLocked}
          type="button"
        >
          <SkipForward size={16} />
          {mode === 'daily' ? 'Next Word (Practice)' : 'Next Word'}
        </button>
        {mode === 'practice' ? (
          <button
            className="control-button"
            onClick={onReturnToDaily}
            disabled={interactionLocked}
            type="button"
          >
            <Sparkles size={16} />
            Return to Daily
          </button>
        ) : null}
      </div>

      {revealedWord ? (
        <div className="revealed-word">
          <span>Revealed target</span>
          <strong>{revealedWord}</strong>
        </div>
      ) : null}

      <div className="hint-feed">
        <div className="hint-feed__header">
          <span>Hints</span>
          <span>{hintHistory.length}/5 used</span>
        </div>
        {hintHistory.length === 0 ? (
          <p className="hint-feed__empty">
            Hints ramp gradually and top out at guidance around 98, never an instant
            solve.
          </p>
        ) : (
          <ol className="hint-feed__list">
            {hintHistory.map((hint) => (
              <li key={hint.level} className="hint-card">
                <div className="hint-card__topline">
                  <strong>Hint {hint.level}</strong>
                  <span>ceiling {hint.maxReachableScore}</span>
                </div>
                <p>{hint.message}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
