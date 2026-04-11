import { Flame, Snowflake, Sparkles } from 'lucide-react'

import type { GuessRecord } from '../store/gameSlice'

type GuessListProps = {
  guesses: GuessRecord[]
  invalidGuess: string | null
}

function heatClass(score: number) {
  if (score >= 90) return 'guess-row--ember'
  if (score >= 75) return 'guess-row--warm'
  if (score >= 55) return 'guess-row--mild'
  return 'guess-row--cold'
}

export function GuessList({ guesses, invalidGuess }: GuessListProps) {
  return (
    <section className="panel guess-list">
      <div className="guess-list__header">
        <div>
          <p className="eyebrow">Reverse chronology</p>
          <h2>Your guesses</h2>
        </div>
        <p>{guesses.length} guesses</p>
      </div>

      {invalidGuess ? <p className="feedback feedback--invalid">{invalidGuess}</p> : null}

      {guesses.length === 0 ? (
        <div className="guess-list__empty">
          <Sparkles size={18} />
          <p>No guesses yet. Try any word to get started.</p>
        </div>
      ) : (
        <ol className="guess-list__items">
          {guesses.map((guess) => (
            <li
              key={`${guess.word}-${guess.submittedAt}`}
              className={`guess-row ${heatClass(guess.score)}`}
            >
              <div className="guess-row__summary">
                <div>
                  <p className="guess-row__word">{guess.word}</p>
                  <p className="guess-row__meta">
                    closeness {guess.score}/100 · {new Date(guess.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="guess-row__score">
                  {guess.score >= 75 ? <Flame size={16} /> : <Snowflake size={16} />}
                  <span>{guess.score}</span>
                </div>
              </div>

              <div className="temperature-bar" aria-hidden="true">
                <div
                  className="temperature-bar__fill"
                  style={{ width: `${guess.score}%` }}
                />
              </div>

              {guess.exact ? (
                <p className="feedback feedback--success">
                  Exact semantic match. Daily target found.
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
