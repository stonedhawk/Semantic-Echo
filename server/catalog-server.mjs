import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(__dirname, 'data/wordCatalog.json')
const suggestionsPath = path.join(__dirname, 'data/wordCatalogSuggestions.json')
const port = Number(process.env.PORT || 8787)

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload, null, 2))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    })
    response.end()
    return
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/catalog.json') {
    try {
      const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
      sendJson(response, 200, catalog)
    } catch {
      sendJson(response, 500, {
        error: 'Catalog unavailable. Run `npm run catalog:build` first.',
      })
    }
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/catalog-suggestions.json') {
    try {
      const suggestions = JSON.parse(await readFile(suggestionsPath, 'utf8'))
      sendJson(response, 200, suggestions)
    } catch {
      sendJson(response, 500, {
        error: 'Catalog suggestions unavailable. Run `npm run catalog:suggest` first.',
      })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Semantic Echo catalog API listening on http://127.0.0.1:${port}`)
})
