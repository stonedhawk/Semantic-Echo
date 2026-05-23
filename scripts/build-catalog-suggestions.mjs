import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TrieEngine } from '@rahulmrx/game-ready-dictionary'
import trieData from '@rahulmrx/game-ready-dictionary/data' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const vectorsPath = path.join(repoRoot, 'src/data/vectors.json')
const seedPath = path.join(repoRoot, 'catalog/wordCatalog.seed.json')
const catalogSuggestionsPath = path.join(repoRoot, 'catalog/wordCatalog.suggestions.json')
const serverSuggestionsPath = path.join(repoRoot, 'server/data/wordCatalogSuggestions.json')

function flattenBuckets(buckets = {}) {
  return Object.values(buckets).flatMap((words) => words.map((word) => String(word).toLowerCase().trim()))
}

async function loadDictionary() {
  const engine = new TrieEngine(trieData)
  return {
    validate: (word) => engine.validate(word),
    source: '@rahulmrx/game-ready-dictionary/data',
  }
}

async function main() {
  const vectors = JSON.parse(await readFile(vectorsPath, 'utf8'))
  const seed = JSON.parse(await readFile(seedPath, 'utf8'))
  const dictionary = await loadDictionary()

  const usedWords = new Set([
    ...flattenBuckets(seed.dailyBuckets),
    ...flattenBuckets(seed.practiceBuckets),
  ])

  const suggestionsByCluster = {}

  for (const [word, entry] of Object.entries(vectors)) {
    if (!dictionary.validate(word) || usedWords.has(word)) {
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

  const payload = {
    generatedAt: new Date().toISOString(),
    dictionaryPath: dictionary.source,
    suggestionCount: Object.values(suggestionsByCluster).reduce(
      (count, words) => count + words.length,
      0,
    ),
    suggestionsByCluster,
  }

  await mkdir(path.dirname(serverSuggestionsPath), { recursive: true })

  const json = `${JSON.stringify(payload, null, 2)}\n`

  await writeFile(catalogSuggestionsPath, json)
  await writeFile(serverSuggestionsPath, json)

  console.log(
    `Built ${payload.suggestionCount} catalog suggestions across ${Object.keys(suggestionsByCluster).length} clusters.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

