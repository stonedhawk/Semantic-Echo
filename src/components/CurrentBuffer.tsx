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
        <p className="eyebrow">Global keyboard capture</p>
        <h2>
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
