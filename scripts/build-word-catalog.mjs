import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const vectorsPath = path.join(repoRoot, 'src/data/vectors.json')
const seedPath = path.join(repoRoot, 'catalog/wordCatalog.seed.json')
const frontendCatalogPath = path.join(repoRoot, 'src/data/wordCatalog.json')
const serverCatalogPath = path.join(repoRoot, 'server/data/wordCatalog.json')

function flattenBuckets(buckets = {}) {
  return Object.values(buckets).flatMap((words) => words)
}

function normalizeWords(words, knownWords) {
  const seen = new Set()
  const validWords = []
  const missingWords = []

  for (const word of words) {
    const normalizedWord = String(word).toLowerCase().trim()

    if (!normalizedWord || seen.has(normalizedWord)) {
      continue
    }

    seen.add(normalizedWord)

    if (knownWords.has(normalizedWord)) {
      validWords.push(normalizedWord)
    } else {
      missingWords.push(normalizedWord)
    }
  }

  return { validWords, missingWords }
}

async function main() {
  const vectors = JSON.parse(await readFile(vectorsPath, 'utf8'))
  const seed = JSON.parse(await readFile(seedPath, 'utf8'))
  const knownWords = new Set(Object.keys(vectors))

  const daily = normalizeWords(flattenBuckets(seed.dailyBuckets), knownWords)
  const practice = normalizeWords(flattenBuckets(seed.practiceBuckets), knownWords)

  if (daily.validWords.length === 0 || practice.validWords.length === 0) {
    throw new Error('Catalog generation failed because one of the playable pools is empty.')
  }

  const catalog = {
    version: seed.version || 'catalog-seed',
    updatedAt: new Date().toISOString().slice(0, 10),
    dailyWords: daily.validWords,
    practiceWords: practice.validWords,
  }

  await mkdir(path.dirname(serverCatalogPath), { recursive: true })

  const payload = `${JSON.stringify(catalog, null, 2)}\n`

  await writeFile(frontendCatalogPath, payload)
  await writeFile(serverCatalogPath, payload)

  const missingWords = [...daily.missingWords, ...practice.missingWords]

  if (missingWords.length > 0) {
    console.warn(
      `Skipped ${missingWords.length} seed words that do not have embeddings: ${missingWords.join(', ')}`,
    )
  }

  console.log(
    `Built catalog ${catalog.version} with ${catalog.dailyWords.length} daily words and ${catalog.practiceWords.length} practice words.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
