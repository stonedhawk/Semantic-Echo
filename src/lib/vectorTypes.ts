export type VectorDatasetEntry = {
  vector: number[]
  cluster: string
}

export type VectorDataset = Record<string, VectorDatasetEntry>

export type WordCatalog = {
  version: string
  updatedAt: string
  dailyWords: string[]
  practiceWords: string[]
}

export type CatalogSource = 'remote' | 'local' | 'embedded-fallback'

export type DailyTarget = {
  puzzleId: string
  puzzleNumber: number
  targetIndex: number
  targetWord: string
}

export type HintPayload = {
  level: number
  message: string
  maxReachableScore: number
}

export type WorkerRequest =
  | {
      type: 'initDataset'
      requestId: string
      datasetUrl: string
      localCatalogUrl?: string
      remoteCatalogUrl?: string
    }
  | {
      type: 'resolveDailyTarget'
      requestId: string
      puzzleId: string
      puzzleNumber: number
    }
  | {
      type: 'resolvePracticeTarget'
      requestId: string
      practiceRound: number
      practiceKey: string
    }
  | {
      type: 'scoreGuess'
      requestId: string
      guess: string
    }
  | {
      type: 'requestHint'
      requestId: string
      hintLevel: number
    }
  | {
      type: 'revealTarget'
      requestId: string
    }

export type WorkerResponse =
  | {
      type: 'initialized'
      requestId: string
      wordCount: number
      playableWordCount: number
      catalogVersion: string
      catalogSource: CatalogSource
    }
  | {
      type: 'targetResolved'
      requestId: string
      target: DailyTarget
    }
  | {
      type: 'scored'
      requestId: string
      guess: string
      score: number
      similarity: number
      exact: boolean
    }
  | {
      type: 'hintGenerated'
      requestId: string
      hint: HintPayload
    }
  | {
      type: 'revealed'
      requestId: string
      targetWord: string
    }
  | {
      type: 'error'
      requestId: string
      code: 'dataset_unavailable' | 'target_unavailable' | 'unknown_word'
      message: string
      guess?: string
    }
