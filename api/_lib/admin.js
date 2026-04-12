import { createHash, timingSafeEqual } from 'node:crypto'

const DEFAULT_REPO_OWNER = 'stonedhawk'
const DEFAULT_REPO_NAME = 'Semantic-Echo'
const DEFAULT_REPO_BRANCH = 'main'

function compareSecret(providedSecret, expectedSecret) {
  const providedHash = createHash('sha256').update(providedSecret).digest()
  const expectedHash = createHash('sha256').update(expectedSecret).digest()

  return timingSafeEqual(providedHash, expectedHash)
}

export function requireAdmin(request) {
  const expectedSecret = process.env.CATALOG_ADMIN_SECRET?.trim()

  if (!expectedSecret) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify(
          {
            error: 'Missing CATALOG_ADMIN_SECRET environment variable.',
          },
          null,
          2,
        ),
        {
          status: 500,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, OPTIONS',
            'access-control-allow-headers': 'Content-Type, X-Admin-Secret',
            'cache-control': 'no-store',
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ),
    }
  }

  const providedSecret = request.headers.get('x-admin-secret')?.trim()

  if (!providedSecret || !compareSecret(providedSecret, expectedSecret)) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify(
          {
            error: 'Unauthorized.',
          },
          null,
          2,
        ),
        {
          status: 401,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, OPTIONS',
            'access-control-allow-headers': 'Content-Type, X-Admin-Secret',
            'cache-control': 'no-store',
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ),
    }
  }

  return { ok: true }
}

export function getGitHubConfig() {
  const token = process.env.CATALOG_GITHUB_TOKEN?.trim()

  if (!token) {
    throw new Error('Missing CATALOG_GITHUB_TOKEN environment variable.')
  }

  return {
    token,
    owner: process.env.CATALOG_GITHUB_REPO_OWNER?.trim() || DEFAULT_REPO_OWNER,
    repo: process.env.CATALOG_GITHUB_REPO_NAME?.trim() || DEFAULT_REPO_NAME,
    branch: process.env.CATALOG_GITHUB_REPO_BRANCH?.trim() || DEFAULT_REPO_BRANCH,
  }
}

async function githubRequest(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'semantic-echo-admin',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `GitHub request failed with status ${response.status}.`)
  }

  return response.json()
}

function toBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64')
}

export async function readRepoFile(filePath) {
  const config = getGitHubConfig()
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`
  const payload = await githubRequest(endpoint, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  })

  return {
    sha: payload.sha,
    content: Buffer.from(payload.content, 'base64').toString('utf8'),
    htmlUrl: payload.html_url,
  }
}

export async function updateRepoFile(filePath, content, sha, message) {
  const config = getGitHubConfig()
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`

  return githubRequest(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      sha,
      branch: config.branch,
    }),
  })
}
