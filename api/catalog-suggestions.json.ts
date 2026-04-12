import {
  createJsonResponse,
  createOptionsResponse,
  readJsonFile,
  suggestionsPath,
} from './_lib/catalog'

export async function GET() {
  try {
    const suggestions = await readJsonFile(suggestionsPath)
    return createJsonResponse(suggestions)
  } catch {
    return createJsonResponse(
      {
        error: 'Catalog suggestions unavailable. Run `npm run catalog:suggest` first.',
      },
      500,
    )
  }
}

export function OPTIONS() {
  return createOptionsResponse()
}
