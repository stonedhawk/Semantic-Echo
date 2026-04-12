import path from 'node:path'

import { readJsonFile } from './catalog.js'

const seedRepoPath = 'catalog/wordCatalog.seed.json'
const vectorsPath = path.join(process.cwd(), 'src/data/vectors.json')

function normalizeWord(word) {
  return String(word).toLowerCase().trim()
}

function flattenBuckets(buckets = {}) {
  return Object.values(buckets).flatMap((words) =>
    words.map((word) => normalizeWord(word)),
  )
}

export async function readVectors() {
  return readJsonFile(vectorsPath)
}

export function getSeedRepoPath() {
  return seedRepoPath
}

export function summarizeSeed(seed) {
  const summarizeBuckets = (buckets) =>
    Object.fromEntries(
      Object.entries(buckets).map(([cluster, words]) => [cluster, words.length]),
    )

  return {
    version: seed.version,
    dailyCounts: summarizeBuckets(seed.dailyBuckets),
    practiceCounts: summarizeBuckets(seed.practiceBuckets),
  }
}

export function buildSuggestionsForSeed(seed, vectors) {
  const usedWords = new Set([
    ...flattenBuckets(seed.dailyBuckets),
    ...flattenBuckets(seed.practiceBuckets),
  ])

  const suggestionsByCluster = {}

  for (const [word, entry] of Object.entries(vectors)) {
    if (usedWords.has(word)) {
      continue
    }

    if (!suggestionsByCluster[entry.cluster]) {
      suggestionsByCluster[entry.cluster] = []
    }

    suggestionsByCluster[entry.cluster].push(word)
  }

  for (const words of Object.values(suggestionsByCluster)) {
    words.sort((left, right) => left.localeCompare(right))
  }

  return {
    generatedAt: new Date().toISOString(),
    dictionaryPath: 'vector-dataset-fallback',
    suggestionCount: Object.values(suggestionsByCluster).reduce(
      (count, words) => count + words.length,
      0,
    ),
    suggestionsByCluster,
  }
}

export function promoteSuggestionInSeed(seed, { word, cluster, target }) {
  const normalizedWord = normalizeWord(word)
  const normalizedCluster = normalizeWord(cluster)

  if (target !== 'daily' && target !== 'practice') {
    throw new Error('Target must be either "daily" or "practice".')
  }

  const bucketKey = target === 'daily' ? 'dailyBuckets' : 'practiceBuckets'
  const targetBucket = seed[bucketKey]?.[normalizedCluster]

  if (!Array.isArray(targetBucket)) {
    throw new Error(`"${normalizedCluster}" is not a valid ${target} bucket.`)
  }

  const usedWords = new Set([
    ...flattenBuckets(seed.dailyBuckets),
    ...flattenBuckets(seed.practiceBuckets),
  ])

  if (usedWords.has(normalizedWord)) {
    throw new Error(`"${normalizedWord}" is already present in the active seed.`)
  }

  targetBucket.push(normalizedWord)
  seed.version = `${seed.version}-rev${new Date().toISOString().slice(0, 10)}`

  return seed
}
