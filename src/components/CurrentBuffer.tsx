import { HelpCircle } from 'lucide-react'

type CurrentBufferProps = {
  value: string
  status: string
  won: boolean
  completed: boolean
  gaveUp: boolean
}

export function CurrentBuffer({
  value,
  status,
  won,
  completed,
  gaveUp,
}: CurrentBufferProps) {
  return (
    <section className="panel current-buffer">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <p className="eyebrow" style={{ margin: 0 }}>Global keyboard capture</p>
          <div className="tooltip-container">
            <HelpCircle size={13} className="tooltip-icon" />
            <div className="tooltip-text">
              <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>🎯 Quick Guide</strong>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                <li><strong>No text box needed:</strong> Simply start typing anywhere on the page!</li>
                <li><strong>Edit & Submit:</strong> Use <kbd style={{ fontSize: '0.7rem', padding: '0.05rem 0.25rem' }}>Backspace</kbd> to edit, and <kbd style={{ fontSize: '0.7rem', padding: '0.05rem 0.25rem' }}>Enter</kbd> to submit.</li>
                <li><strong>Warmth Score:</strong> Every guess gets a score from 0 to 100 based on semantic similarity. Closer meaning = hotter score!</li>
              </ul>
            </div>
          </div>
        </div>
        <h2 style={{ marginTop: '0.35rem' }}>
          {won
            ? 'Target solved'
            : gaveUp
              ? 'Round forfeited'
              : completed
                ? 'Round complete'
                : 'Current guess buffer'}
        </h2>
      </div>

      <div className="buffer-word" aria-live="polite">
        {completed ? 'round locked - restart or advance' : value || 'type anywhere to begin'}
      </div>

      <p className="buffer-hint">
        Type anywhere to build a word, use <kbd>Backspace</kbd> to edit, and{' '}
        press <kbd>Enter</kbd> to submit.
      </p>

      <p className="buffer-status">Game status: {status}</p>
    </section>
  )
}
