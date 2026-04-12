import {
  buildSuggestionsForSeed,
  getSeedRepoPath,
  promoteSuggestionInSeed,
  readVectors,
  summarizeSeed,
} from '../_lib/catalog-admin.js'
import { requireAdmin, readRepoFile, updateRepoFile } from '../_lib/admin.js'
import { createJsonResponse, createOptionsResponse } from '../_lib/catalog.js'

export async function POST(request) {
  const auth = requireAdmin(request)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { word, cluster, target } = await request.json()
    const seedPath = getSeedRepoPath()
    const seedFile = await readRepoFile(seedPath)
    const seed = JSON.parse(seedFile.content)

    promoteSuggestionInSeed(seed, { word, cluster, target })

    const updatedContent = `${JSON.stringify(seed, null, 2)}\n`
    const githubResponse = await updateRepoFile(
      seedPath,
      updatedContent,
      seedFile.sha,
      `chore: promote ${word} into ${target}:${cluster}`,
    )
    const vectors = await readVectors()
    const suggestions = buildSuggestionsForSeed(seed, vectors)

    return createJsonResponse({
      message: `Promoted "${word}" into ${target}:${cluster}. GitHub and Vercel will pick up the new seed.`,
      seed: summarizeSeed(seed),
      suggestions,
      commitUrl: githubResponse.commit?.html_url ?? null,
    })
  } catch (error) {
    return createJsonResponse(
      {
        error: error instanceof Error ? error.message : 'Could not promote suggestion.',
      },
      500,
    )
  }
}

export function OPTIONS() {
  return createOptionsResponse()
}
