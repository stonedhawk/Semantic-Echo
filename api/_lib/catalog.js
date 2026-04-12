import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

export const catalogPath = path.join(repoRoot, 'server/data/wordCatalog.json')
export const suggestionsPath = path.join(
  repoRoot,
  'server/data/wordCatalogSuggestions.json',
)

export function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export function createHtmlResponse(payload, status = 200) {
  return new Response(payload, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

export function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    },
  })
}

export async function readJsonFile(targetPath) {
  return JSON.parse(await readFile(targetPath, 'utf8'))
}
