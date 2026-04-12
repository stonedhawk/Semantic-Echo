const DEFAULT_REMOTE_CATALOG_URL =
  'https://semantic-echo-catalog.vercel.app/api/catalog.json'

export function getRemoteCatalogUrl() {
  const configuredUrl =
    import.meta.env.VITE_WORD_CATALOG_URL?.trim() || DEFAULT_REMOTE_CATALOG_URL

  if (!configuredUrl) {
    return null
  }

  return new URL(configuredUrl, window.location.href).toString()
}
