import { configureStore } from '@reduxjs/toolkit'

import { gameReducer } from './gameSlice'
import {
  listenerMiddleware,
  registerPersistenceListeners,
} from './listeners'

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
})

registerPersistenceListeners()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
