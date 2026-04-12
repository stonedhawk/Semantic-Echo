import { createJsonResponse, createOptionsResponse } from './_lib/catalog.js'

export function GET() {
  return createJsonResponse({ ok: true })
}

export function OPTIONS() {
  return createOptionsResponse()
}
