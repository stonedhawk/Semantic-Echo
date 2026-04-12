import { catalogPath, createJsonResponse, createOptionsResponse, readJsonFile } from './_lib/catalog'

export async function GET() {
  try {
    const catalog = await readJsonFile(catalogPath)
    return createJsonResponse(catalog)
  } catch {
    return createJsonResponse(
      {
        error: 'Catalog unavailable. Run `npm run catalog:build` first.',
      },
      500,
    )
  }
}

export function OPTIONS() {
  return createOptionsResponse()
}
