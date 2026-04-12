import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const seedPath = path.join(repoRoot, 'catalog/wordCatalog.seed.json')
const suggestionsPath = path.join(repoRoot, 'catalog/wordCatalog.suggestions.json')

function getArg(flag) {
  const index = process.argv.indexOf(flag)

  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

function normalizeWord(word) {
  return String(word).toLowerCase().trim()
}

function collectUsedWords(seed) {
  const usedWords = new Set()

  for (const buckets of [seed.dailyBuckets, seed.practiceBuckets]) {
    for (const words of Object.values(buckets)) {
      for (const word of words) {
        usedWords.add(normalizeWord(word))
      }
    }
  }

  return usedWords
}

async function main() {
  const word = getArg('--word')
  const cluster = getArg('--cluster')
  const target = getArg('--target')

  if (!word || !cluster || !target) {
    throw new Error(
      'Usage: node scripts/promote-catalog-suggestion.mjs --word <word> --cluster <cluster> --target <daily|practice>',
    )
  }

  if (target !== 'daily' && target !== 'practice') {
    throw new Error('Target must be either "daily" or "practice".')
  }

  const normalizedWord = normalizeWord(word)
  const normalizedCluster = normalizeWord(cluster)
  const seed = JSON.parse(await readFile(seedPath, 'utf8'))
  const suggestions = JSON.parse(await readFile(suggestionsPath, 'utf8'))

  const suggestionBucket = suggestions.suggestionsByCluster?.[normalizedCluster]

  if (!Array.isArray(suggestionBucket) || !suggestionBucket.includes(normalizedWord)) {
    throw new Error(
      `"${normalizedWord}" is not currently available in the "${normalizedCluster}" suggestion bucket.`,
    )
  }

  const usedWords = collectUsedWords(seed)

  if (usedWords.has(normalizedWord)) {
    throw new Error(`"${normalizedWord}" is already present in the active seed.`)
  }

  const bucketKey = target === 'daily' ? 'dailyBuckets' : 'practiceBuckets'

  if (!Array.isArray(seed[bucketKey]?.[normalizedCluster])) {
    throw new Error(
      `"${normalizedCluster}" is not a valid ${target} bucket in the seed file.`,
    )
  }

  seed[bucketKey][normalizedCluster].push(normalizedWord)
  seed.version = `${seed.version}-rev${new Date().toISOString().slice(0, 10)}`

  await writeFile(seedPath, `${JSON.stringify(seed, null, 2)}\n`)

  console.log(
    `Promoted "${normalizedWord}" into ${target}:${normalizedCluster}. Run "npm run catalog:refresh" next.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
