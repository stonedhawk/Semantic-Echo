import { buildSuggestionsForSeed, readVectors, summarizeSeed } from '../_lib/catalog-admin.js'
import { requireAdmin, readRepoFile } from '../_lib/admin.js'
import { createJsonResponse, createOptionsResponse } from '../_lib/catalog.js'

export async function GET(request) {
  const auth = requireAdmin(request)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const seedFile = await readRepoFile('catalog/wordCatalog.seed.json')
    const seed = JSON.parse(seedFile.content)
    const vectors = await readVectors()
    const suggestions = buildSuggestionsForSeed(seed, vectors)

    return createJsonResponse({
      seed: summarizeSeed(seed),
      catalog: {
        dailyWordCount: Object.values(seed.dailyBuckets).reduce(
          (count, words) => count + words.length,
          0,
        ),
        practiceWordCount: Object.values(seed.practiceBuckets).reduce(
          (count, words) => count + words.length,
          0,
        ),
      },
      suggestions,
      seedHtmlUrl: seedFile.htmlUrl,
    })
  } catch (error) {
    return createJsonResponse(
      {
        error: error instanceof Error ? error.message : 'Could not load admin state.',
      },
      500,
    )
  }
}

export function OPTIONS() {
  return createOptionsResponse()
}
