import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  buildGraphifySeries,
  type TrajectoryAnalytics,
} from '../features/trajectory/graphify'
import type { HintPayload } from '../lib/vectorTypes'

export type GuessRecord = {
  word: string
  score: number
  similarity: number
  exact: boolean
  submittedAt: string
}

export type PersistedGameState = {
  mode: 'daily' | 'practice'
  puzzleId: string
  puzzleNumber: number
  practiceRound: number
  practiceKey: string | null
  currentInput: string
  guesses: GuessRecord[]
  trajectory: TrajectoryAnalytics
  won: boolean
  gaveUp: boolean
  completed: boolean
  revealedWord: string | null
  hintHistory: HintPayload[]
  invalidGuess: string | null
}

export type GameState = PersistedGameState & {
  status: 'booting' | 'loading' | 'ready' | 'scoring' | 'error'
  workerReady: boolean
  datasetWordCount: number
  targetResolved: boolean
  errorMessage: string | null
}

const emptyTrajectory = buildGraphifySeries([])

const initialState: GameState = {
  mode: 'daily',
  puzzleId: '',
  puzzleNumber: 0,
  practiceRound: 0,
  practiceKey: null,
  currentInput: '',
  guesses: [],
  trajectory: emptyTrajectory,
  won: false,
  gaveUp: false,
  completed: false,
  revealedWord: null,
  hintHistory: [],
  invalidGuess: null,
  status: 'booting',
  workerReady: false,
  datasetWordCount: 0,
  targetResolved: false,
  errorMessage: null,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSessionContext(
      state,
      action: PayloadAction<{
        mode: 'daily' | 'practice'
        puzzleId: string
        puzzleNumber: number
        practiceRound: number
        practiceKey: string | null
      }>,
    ) {
      const isNewPuzzle =
        state.mode !== action.payload.mode ||
        state.puzzleId !== action.payload.puzzleId

      state.mode = action.payload.mode
      state.puzzleId = action.payload.puzzleId
      state.puzzleNumber = action.payload.puzzleNumber
      state.practiceRound = action.payload.practiceRound
      state.practiceKey = action.payload.practiceKey

      if (isNewPuzzle) {
        state.currentInput = ''
        state.guesses = []
        state.trajectory = emptyTrajectory
        state.won = false
        state.gaveUp = false
        state.completed = false
        state.revealedWord = null
        state.hintHistory = []
        state.invalidGuess = null
        state.targetResolved = false
        state.errorMessage = null
      }
    },
    hydrateSession(state, action: PayloadAction<PersistedGameState>) {
      state.mode = action.payload.mode
      state.puzzleId = action.payload.puzzleId
      state.puzzleNumber = action.payload.puzzleNumber
      state.practiceRound = action.payload.practiceRound
      state.practiceKey = action.payload.practiceKey
      state.currentInput = action.payload.currentInput
      state.guesses = action.payload.guesses
      state.trajectory = action.payload.trajectory
      state.won = action.payload.won
      state.gaveUp = action.payload.gaveUp
      state.completed = action.payload.completed
      state.revealedWord = action.payload.revealedWord
      state.hintHistory = action.payload.hintHistory
      state.invalidGuess = action.payload.invalidGuess
    },
    appendCharacter(state, action: PayloadAction<string>) {
      if (state.completed || state.currentInput.length >= 24) {
        return
      }

      state.currentInput += action.payload
      state.invalidGuess = null
      state.errorMessage = null
    },
    backspace(state) {
      if (state.completed) {
        return
      }

      state.currentInput = state.currentInput.slice(0, -1)
    },
    restartRound(state) {
      state.currentInput = ''
      state.guesses = []
      state.trajectory = emptyTrajectory
      state.won = false
      state.gaveUp = false
      state.completed = false
      state.revealedWord = null
      state.hintHistory = []
      state.invalidGuess = null
      state.errorMessage = null
      state.status = 'ready'
    },
    markGuessRejected(state, action: PayloadAction<string>) {
      state.invalidGuess = action.payload
      state.status = 'ready'
    },
    setStatus(state, action: PayloadAction<GameState['status']>) {
      state.status = action.payload
    },
    setWorkerReady(state, action: PayloadAction<{ wordCount: number }>) {
      state.workerReady = true
      state.datasetWordCount = action.payload.wordCount
      state.errorMessage = null
    },
    setTargetResolved(state) {
      state.targetResolved = true
      state.status = 'ready'
    },
    recordGuess(state, action: PayloadAction<GuessRecord>) {
      state.guesses.unshift(action.payload)
      state.won = action.payload.exact
      state.gaveUp = false
      state.completed = action.payload.exact
      state.revealedWord = action.payload.exact ? action.payload.word : state.revealedWord
      state.invalidGuess = null
      state.currentInput = ''
      state.status = 'ready'
      state.trajectory = buildGraphifySeries(
        state.guesses.map((guess) => guess.score),
      )
    },
    addHint(state, action: PayloadAction<HintPayload>) {
      const exists = state.hintHistory.some(
        (hint) => hint.level === action.payload.level,
      )

      if (!exists) {
        state.hintHistory.push(action.payload)
      }

      state.status = 'ready'
    },
    revealWord(state, action: PayloadAction<string>) {
      state.revealedWord = action.payload
      state.gaveUp = true
      state.completed = true
      state.currentInput = ''
      state.status = 'ready'
    },
    setError(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.errorMessage = action.payload
    },
  },
})

export const {
  appendCharacter,
  addHint,
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
} = gameSlice.actions

export const gameReducer = gameSlice.reducer

export function selectPersistedGameState(state: { game: GameState }) {
  return {
    mode: state.game.mode,
    puzzleId: state.game.puzzleId,
    puzzleNumber: state.game.puzzleNumber,
    practiceRound: state.game.practiceRound,
    practiceKey: state.game.practiceKey,
    currentInput: state.game.currentInput,
    guesses: state.game.guesses,
    trajectory: state.game.trajectory,
    won: state.game.won,
    gaveUp: state.game.gaveUp,
    completed: state.game.completed,
    revealedWord: state.game.revealedWord,
    hintHistory: state.game.hintHistory,
    invalidGuess: state.game.invalidGuess,
  } satisfies PersistedGameState
}
