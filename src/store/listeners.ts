import {
  createListenerMiddleware,
  isAnyOf,
  type TypedStartListening,
} from '@reduxjs/toolkit'

import type { PersistedGameState } from './gameSlice'
import {
  addHint,
  hydrateSession,
  markGuessRejected,
  recordGuess,
  restartRound,
  revealWord,
  selectPersistedGameState,
  setSessionContext,
} from './gameSlice'
import type { AppDispatch, RootState } from './store'

const STORAGE_KEY = 'semantic-echo:session'
type PersistedEnvelope = {
  daily?: PersistedGameState
  practice?: PersistedGameState
}

export const listenerMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState, AppDispatch>

const startAppListening =
  listenerMiddleware.startListening as AppStartListening

function readEnvelope() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {} satisfies PersistedEnvelope
  }

  try {
    return JSON.parse(raw) as PersistedEnvelope
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return {} satisfies PersistedEnvelope
  }
}

function writeState(state: RootState) {
  const snapshot = selectPersistedGameState({ game: state.game })
  const envelope = readEnvelope()
  envelope[snapshot.mode] = snapshot
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
}

export function readPersistedState(mode: 'daily' | 'practice') {
  const envelope = readEnvelope()
  return envelope[mode] ?? null
}

export function registerPersistenceListeners() {
  startAppListening({
    matcher: isAnyOf(
      recordGuess,
      markGuessRejected,
      hydrateSession,
      addHint,
      revealWord,
      restartRound,
    ),
    effect: (_action, api) => {
      writeState(api.getState())
    },
  })

  startAppListening({
    actionCreator: setSessionContext,
    effect: (_action, api) => {
      const state = api.getState()
      const persisted = readPersistedState(state.game.mode)

      if (!persisted || persisted.puzzleId !== state.game.puzzleId) {
        const envelope = readEnvelope()
        delete envelope[state.game.mode]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
      }
    },
  })
}
