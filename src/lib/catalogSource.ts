export function getRemoteCatalogUrl() {
  const configuredUrl = import.meta.env.VITE_WORD_CATALOG_URL?.trim()

  if (!configuredUrl) {
    return null
  }

  return new URL(configuredUrl, window.location.href).toString()
}

