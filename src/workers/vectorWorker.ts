/// <reference lib="webworker" />

import type {
  DailyTarget,
  HintPayload,
  WordCatalog,
  VectorDataset,
  VectorDatasetEntry,
  WorkerRequest,
  WorkerResponse,
} from '../lib/vectorTypes'

let datasetEntries: VectorDataset = {}
let knownWords: string[] = []
let dailyWordPool: string[] = []
let practiceWordPool: string[] = []
let target: DailyTarget | null = null
let targetEntry: VectorDatasetEntry | null = null

function hashPuzzleId(puzzleId: string) {
  let hash = 2166136261

  for (let index = 0; index < puzzleId.length; index += 1) {
    hash ^= puzzleId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return Math.abs(hash >>> 0)
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index]
    const rightValue = right[index]
    dot += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

function normalizeSimilarity(similarity: number) {
  const normalized = ((similarity + 1) / 2) * 100
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

function maskWord(targetWord: string, revealIndexes: number[]) {
  return targetWord
    .split('')
    .map((character, index) =>
      revealIndexes.includes(index) ? character : '_',
    )
    .join('')
}

function buildHint(targetWord: string, cluster: string, level: number): HintPayload {
  const clampedLevel = Math.max(1, Math.min(level, 5))
  const lastIndex = targetWord.length - 1

  switch (clampedLevel) {
    case 1:
      return {
        level: 1,
        message: `This word belongs to the ${cluster} group.`,
        maxReachableScore: 70,
      }
    case 2:
      return {
        level: 2,
        message: `The hidden word has ${targetWord.length} letters.`,
        maxReachableScore: 82,
      }
    case 3:
      return {
        level: 3,
        message: `The hidden word starts with "${targetWord[0]}".`,
        maxReachableScore: 90,
      }
    case 4:
      return {
        level: 4,
        message: `The hidden word starts with "${targetWord[0]}" and ends with "${targetWord[lastIndex]}".`,
        maxReachableScore: 96,
      }
    default: {
      const hiddenIndex = targetWord.length > 3 ? Math.floor(targetWord.length / 2) : 1
      const revealIndexes = Array.from({ length: targetWord.length }, (_, index) => index).filter(
        (index) => index !== hiddenIndex,
      )

      return {
        level: 5,
        message: `Almost there: ${maskWord(targetWord, revealIndexes)}.`,
        maxReachableScore: 98,
      }
    }
  }
}

function uniqueKnownWords(words: string[]) {
  return [...new Set(words.map((word) => word.toLowerCase().trim()))].filter(
    (word) => Boolean(datasetEntries[word]),
  )
}

function buildFallbackCatalog(): WordCatalog {
  return {
    version: 'embedded-fallback',
    updatedAt: new Date().toISOString(),
    dailyWords: knownWords,
    practiceWords: knownWords,
  }
}

async function loadCatalog(catalogUrl?: string) {
  if (!catalogUrl) {
    return buildFallbackCatalog()
  }

  try {
    const response = await fetch(catalogUrl)

    if (!response.ok) {
      return buildFallbackCatalog()
    }

    const catalog = (await response.json()) as WordCatalog
    const dailyWords = uniqueKnownWords(catalog.dailyWords ?? [])
    const practiceWords = uniqueKnownWords(catalog.practiceWords ?? [])

    return {
      version: catalog.version || 'embedded-fallback',
      updatedAt: catalog.updatedAt || new Date().toISOString(),
      dailyWords: dailyWords.length > 0 ? dailyWords : knownWords,
      practiceWords: practiceWords.length > 0 ? practiceWords : knownWords,
    } satisfies WordCatalog
  } catch {
    return buildFallbackCatalog()
  }
}

function post(message: WorkerResponse) {
  self.postMessage(message)
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data

  if (message.type === 'initDataset') {
    try {
      const response = await fetch(message.datasetUrl)
      const json = (await response.json()) as VectorDataset

      datasetEntries = json
      knownWords = Object.keys(datasetEntries)
      const catalog = await loadCatalog(message.catalogUrl)
      dailyWordPool = catalog.dailyWords
      practiceWordPool = catalog.practiceWords

      post({
        type: 'initialized',
        requestId: message.requestId,
        wordCount: knownWords.length,
        playableWordCount: new Set([...dailyWordPool, ...practiceWordPool]).size,
        catalogVersion: catalog.version,
      })
    } catch {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'dataset_unavailable',
        message: 'The vector dataset could not be loaded.',
      })
    }
  }

  if (message.type === 'resolveDailyTarget') {
    if (knownWords.length === 0) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'dataset_unavailable',
        message: 'The vector dataset is not ready yet.',
      })
      return
    }

    const dailyTargetIndex = hashPuzzleId(message.puzzleId) % dailyWordPool.length
    const targetWord = dailyWordPool[dailyTargetIndex]

    target = {
      puzzleId: message.puzzleId,
      puzzleNumber: message.puzzleNumber,
      targetIndex: dailyTargetIndex,
      targetWord,
    }
    targetEntry = datasetEntries[targetWord]

    post({
      type: 'targetResolved',
      requestId: message.requestId,
      target,
    })
  }

  if (message.type === 'resolvePracticeTarget') {
    if (knownWords.length === 0) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'dataset_unavailable',
        message: 'The vector dataset is not ready yet.',
      })
      return
    }

    const puzzleId = message.practiceKey
    const practiceTargetIndex = hashPuzzleId(puzzleId) % practiceWordPool.length
    const targetWord = practiceWordPool[practiceTargetIndex]

    target = {
      puzzleId,
      puzzleNumber: message.practiceRound,
      targetIndex: practiceTargetIndex,
      targetWord,
    }
    targetEntry = datasetEntries[targetWord]

    post({
      type: 'targetResolved',
      requestId: message.requestId,
      target,
    })
  }

  if (message.type === 'scoreGuess') {
    if (!target || !targetEntry) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'target_unavailable',
        message: 'The hidden word is not ready yet.',
      })
      return
    }

    const guess = message.guess.toLowerCase().trim()
    const guessEntry = datasetEntries[guess]

    if (!guessEntry) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'unknown_word',
        guess,
        message: `"${guess}" is not in the current word list.`,
      })
      return
    }

    const exact = guess === target.targetWord
    const similarity = cosineSimilarity(guessEntry.vector, targetEntry.vector)
    const score = exact ? 100 : normalizeSimilarity(similarity)

    post({
      type: 'scored',
      requestId: message.requestId,
      guess,
      score,
      similarity,
      exact,
    })
  }

  if (message.type === 'requestHint') {
    if (!target || !targetEntry) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'target_unavailable',
        message: 'The hidden word is not ready yet.',
      })
      return
    }

    post({
      type: 'hintGenerated',
      requestId: message.requestId,
      hint: buildHint(target.targetWord, targetEntry.cluster, message.hintLevel),
    })
  }

  if (message.type === 'revealTarget') {
    if (!target) {
      post({
        type: 'error',
        requestId: message.requestId,
        code: 'target_unavailable',
        message: 'The target is not available to reveal yet.',
      })
      return
    }

    post({
      type: 'revealed',
      requestId: message.requestId,
      targetWord: target.targetWord,
    })
  }
}

export {}
