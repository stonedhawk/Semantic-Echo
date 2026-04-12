import type {
  DailyTarget,
  HintPayload,
  WorkerRequest,
  WorkerResponse,
} from '../lib/vectorTypes'

type InitRequest = Extract<WorkerRequest, { type: 'initDataset' }>
type ResolveTargetRequest = Extract<WorkerRequest, { type: 'resolveDailyTarget' }>
type ResolvePracticeRequest = Extract<WorkerRequest, { type: 'resolvePracticeTarget' }>
type ScoreGuessRequest = Extract<WorkerRequest, { type: 'scoreGuess' }>
type HintRequest = Extract<WorkerRequest, { type: 'requestHint' }>
type RevealRequest = Extract<WorkerRequest, { type: 'revealTarget' }>
type ScoredResponse = Extract<WorkerResponse, { type: 'scored' }>
type WorkerDispatchRequest =
  | Omit<InitRequest, 'requestId'>
  | Omit<ResolveTargetRequest, 'requestId'>
  | Omit<ResolvePracticeRequest, 'requestId'>
  | Omit<ScoreGuessRequest, 'requestId'>
  | Omit<HintRequest, 'requestId'>
  | Omit<RevealRequest, 'requestId'>

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

type PendingHandler = {
  resolve: (value: WorkerResponse) => void
  reject: (reason?: unknown) => void
}

export class VectorWorkerClient {
  private readonly worker = new Worker(
    new URL('./vectorWorker.ts', import.meta.url),
    {
      type: 'module',
    },
  )

  private readonly pending = new Map<string, PendingHandler>()

  constructor() {
    this.worker.addEventListener(
      'message',
      (event: MessageEvent<WorkerResponse>) => {
        const message = event.data
        const pending = this.pending.get(message.requestId)

        if (!pending) {
          return
        }

        this.pending.delete(message.requestId)
        pending.resolve(message)
      },
    )

    this.worker.addEventListener('error', (error) => {
      this.pending.forEach(({ reject }) => reject(error))
      this.pending.clear()
    })
  }

  private dispatch(request: WorkerDispatchRequest) {
    const requestId = createRequestId()

    return new Promise<WorkerResponse>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject })
      this.worker.postMessage({ ...request, requestId })
    })
  }

  async init(
    datasetUrl: string,
    localCatalogUrl?: string,
    remoteCatalogUrl?: string,
  ) {
    const response = await this.dispatch({
      type: 'initDataset',
      datasetUrl,
      localCatalogUrl,
      remoteCatalogUrl,
    } satisfies Omit<InitRequest, 'requestId'>)

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    if (response.type !== 'initialized') {
      throw new Error('Unexpected worker response while loading the dataset.')
    }

    return {
      wordCount: response.wordCount,
      playableWordCount: response.playableWordCount,
      catalogVersion: response.catalogVersion,
      catalogSource: response.catalogSource,
    }
  }

  async resolveDailyTarget(puzzleId: string, puzzleNumber: number) {
    const response = await this.dispatch({
      type: 'resolveDailyTarget',
      puzzleId,
      puzzleNumber,
    } satisfies Omit<ResolveTargetRequest, 'requestId'>)

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    if (response.type !== 'targetResolved') {
      throw new Error('Unexpected worker response while resolving the daily target.')
    }

    return response.target satisfies DailyTarget
  }

  async resolvePracticeTarget(practiceRound: number, practiceKey: string) {
    const response = await this.dispatch({
      type: 'resolvePracticeTarget',
      practiceRound,
      practiceKey,
    } satisfies Omit<ResolvePracticeRequest, 'requestId'>)

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    if (response.type !== 'targetResolved') {
      throw new Error('Unexpected worker response while resolving the practice target.')
    }

    return response.target satisfies DailyTarget
  }

  async scoreGuess(guess: string): Promise<ScoredResponse> {
    const response = await this.dispatch({
      type: 'scoreGuess',
      guess,
    } satisfies Omit<ScoreGuessRequest, 'requestId'>)

    if (response.type === 'error') {
      const error = new Error(response.message)
      error.name = response.code
      throw error
    }

    if (response.type !== 'scored') {
      throw new Error('Unexpected worker response while scoring the guess.')
    }

    return response
  }

  async requestHint(hintLevel: number): Promise<HintPayload> {
    const response = await this.dispatch({
      type: 'requestHint',
      hintLevel,
    } satisfies Omit<HintRequest, 'requestId'>)

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    if (response.type !== 'hintGenerated') {
      throw new Error('Unexpected worker response while generating a hint.')
    }

    return response.hint
  }

  async revealTarget(): Promise<string> {
    const response = await this.dispatch({
      type: 'revealTarget',
    } satisfies Omit<RevealRequest, 'requestId'>)

    if (response.type === 'error') {
      throw new Error(response.message)
    }

    if (response.type !== 'revealed') {
      throw new Error('Unexpected worker response while revealing the target.')
    }

    return response.targetWord
  }

  dispose() {
    this.worker.terminate()
  }
}
