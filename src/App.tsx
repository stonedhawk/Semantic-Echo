import { useCallback, useEffect, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'

import './index.css'
import { ControlPanel } from './components/ControlPanel'
import { CurrentBuffer } from './components/CurrentBuffer'
import { GuessList } from './components/GuessList'
import { TopBar } from './components/TopBar'
import { TrajectoryHUD } from './components/TrajectoryHUD'
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard'
import { getDailyPuzzleContext } from './lib/dailySeed'
import {
  addHint,
  appendCharacter,
  backspace,
  hydrateSession,
  markGuessRejected,
  recordGuess,
  restartRound,
  revealWord,
  setError,
  setSessionContext,
  setStatus,
  setTargetResolved,
  setWorkerReady,
} from './store/gameSlice'
import { readPersistedState } from './store/listeners'
import type { RootState } from './store/store'
import { store } from './store/store'
import { VectorWorkerClient } from './workers/vectorWorkerClient'

function SemanticEchoApp() {
  const dispatch = useDispatch<typeof store.dispatch>()
  const game = useSelector((state: RootState) => state.game)
  const workerRef = useRef<VectorWorkerClient | null>(null)

  function createPracticeKey(practiceRound: number) {
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    return `practice-${practiceRound}-${randomPart}`
  }

  const loadDailyRound = useCallback(async () => {
    if (!workerRef.current) {
      return
    }

    const puzzle = getDailyPuzzleContext()

    dispatch(
      setSessionContext({
        mode: 'daily',
        puzzleId: puzzle.puzzleId,
        puzzleNumber: puzzle.puzzleNumber,
        practiceRound: 0,
        practiceKey: null,
      }),
    )
    dispatch(setStatus('loading'))
    await workerRef.current.resolveDailyTarget(puzzle.puzzleId, puzzle.puzzleNumber)
    dispatch(setTargetResolved())

    const persisted = readPersistedState('daily')

    if (persisted && persisted.puzzleId === puzzle.puzzleId) {
      dispatch(hydrateSession(persisted))
      return
    }

    const starterHint = await workerRef.current.requestHint(1)
    dispatch(addHint(starterHint))
  }, [dispatch])

  const loadPracticeRound = useCallback(
    async (practiceRound: number, practiceKey = createPracticeKey(practiceRound)) => {
    if (!workerRef.current) {
      return
    }

    dispatch(
      setSessionContext({
        mode: 'practice',
        puzzleId: practiceKey,
        puzzleNumber: practiceRound,
        practiceRound,
        practiceKey,
      }),
    )
    dispatch(setStatus('loading'))
    await workerRef.current.resolvePracticeTarget(practiceRound, practiceKey)
    dispatch(setTargetResolved())

    const persisted = readPersistedState('practice')

    if (persisted && persisted.puzzleId === practiceKey) {
      dispatch(hydrateSession(persisted))
      return
    }

    const starterHint = await workerRef.current.requestHint(1)
    dispatch(addHint(starterHint))
  }, [dispatch])

  useEffect(() => {
    const worker = new VectorWorkerClient()
    const datasetUrl = new URL('./data/vectors.json', import.meta.url).toString()
    workerRef.current = worker
    dispatch(setStatus('loading'))

    void (async () => {
      try {
        const wordCount = await worker.init(datasetUrl)
        dispatch(setWorkerReady({ wordCount }))
        const practiceSession = readPersistedState('practice')

        if (practiceSession && !practiceSession.completed) {
          await loadPracticeRound(
            practiceSession.practiceRound,
            practiceSession.practiceKey ?? practiceSession.puzzleId,
          )
          return
        }

        await loadDailyRound()
      } catch (error) {
        dispatch(
          setError(
            error instanceof Error ? error.message : 'The vector worker failed to boot.',
          ),
        )
      }
    })()

    return () => {
      worker.dispose()
    }
  }, [dispatch, loadDailyRound, loadPracticeRound])

  async function submitGuess() {
    if (!workerRef.current) {
      return
    }

    const guess = game.currentInput.trim().toLowerCase()

    if (!guess) {
      dispatch(markGuessRejected('Enter a word before validating the guess.'))
      return
    }

    if (game.status === 'scoring' || !game.targetResolved) {
      return
    }

    dispatch(setStatus('scoring'))

    try {
      const result = await workerRef.current.scoreGuess(guess)
      const activeHintCap =
        game.hintHistory.length > 0
          ? game.hintHistory[game.hintHistory.length - 1].maxReachableScore
          : 100
      const visibleScore = result.exact
        ? 100
        : Math.min(result.score, activeHintCap)

      dispatch(
        recordGuess({
          word: result.guess,
          score: visibleScore,
          similarity: result.similarity,
          exact: result.exact,
          submittedAt: new Date().toISOString(),
        }),
      )
    } catch (error) {
      if (error instanceof Error && error.name === 'unknown_word') {
        dispatch(markGuessRejected(error.message))
        return
      }

      dispatch(
        setError(error instanceof Error ? error.message : 'Scoring failed unexpectedly.'),
      )
    }
  }

  async function requestHint() {
    if (!workerRef.current || game.completed) {
      return
    }

    dispatch(setStatus('scoring'))

    try {
      const hint = await workerRef.current.requestHint(game.hintHistory.length + 1)
      dispatch(addHint(hint))
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : 'Hint generation failed.'),
      )
    }
  }

  async function giveUp() {
    if (!workerRef.current || game.completed) {
      return
    }

    dispatch(setStatus('scoring'))

    try {
      const targetWord = await workerRef.current.revealTarget()
      dispatch(revealWord(targetWord))
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : 'Reveal failed unexpectedly.'),
      )
    }
  }

  async function goToNextWord() {
    try {
      const nextPracticeRound =
        game.mode === 'practice' ? game.practiceRound + 1 : 1
      await loadPracticeRound(nextPracticeRound)
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : 'Could not advance practice mode.'),
      )
    }
  }

  useGlobalKeyboard({
    onCharacter: (character) => dispatch(appendCharacter(character)),
    onBackspace: () => dispatch(backspace()),
    onSubmit: () => {
      void submitGuess()
    },
  })

  return (
    <main className="app-shell">
      <TopBar
        mode={game.mode}
        puzzleNumber={game.puzzleNumber}
        wordCount={game.datasetWordCount}
        ready={game.workerReady && game.targetResolved}
      />

      <section className="layout-grid">
        <div className="main-column">
          <CurrentBuffer
            value={game.currentInput}
            status={game.status}
            won={game.won}
            completed={game.completed}
            gaveUp={game.gaveUp}
          />
          <ControlPanel
            mode={game.mode}
            completed={game.completed}
            status={game.status}
            hintHistory={game.hintHistory}
            revealedWord={game.revealedWord}
            onHint={() => {
              void requestHint()
            }}
            onGiveUp={() => {
              void giveUp()
            }}
            onRestart={() => dispatch(restartRound())}
            onNextWord={() => {
              void goToNextWord()
            }}
            onReturnToDaily={() => {
              void loadDailyRound()
            }}
          />
          {game.errorMessage ? (
            <div className="panel error-panel">{game.errorMessage}</div>
          ) : null}
          <GuessList guesses={game.guesses} invalidGuess={game.invalidGuess} />
        </div>

        <TrajectoryHUD trajectory={game.trajectory} />
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <SemanticEchoApp />
    </Provider>
  )
}
