import { createHtmlResponse } from '../_lib/catalog.js'

const html = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Semantic Echo Admin</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #071019;
        --panel: rgba(14, 19, 29, 0.92);
        --border: rgba(148, 163, 184, 0.18);
        --text: #e8eef8;
        --muted: #94a3b8;
        --accent: #7dd3fc;
        --accent-2: #fb7185;
        --success: #4ade80;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, sans-serif;
        background:
          radial-gradient(circle at top, rgba(125, 211, 252, 0.14), transparent 20rem),
          linear-gradient(180deg, #05070b, #071019);
        color: var(--text);
      }
      .shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 1.25rem;
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      }
      h1, h2, h3, p { margin-top: 0; }
      .header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; margin-bottom: 1rem; }
      .muted { color: var(--muted); }
      .grid { display: grid; gap: 1rem; grid-template-columns: 320px minmax(0, 1fr); }
      .stack { display: grid; gap: 1rem; }
      input, button, select {
        width: 100%;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.04);
        color: var(--text);
        padding: 0.85rem 1rem;
        font: inherit;
      }
      button {
        cursor: pointer;
        background: linear-gradient(135deg, rgba(125,211,252,0.18), rgba(251,113,133,0.18));
      }
      button.secondary { background: rgba(255,255,255,0.04); }
      .row { display: flex; gap: 0.75rem; }
      .row > * { flex: 1; }
      .chips { display: flex; gap: 0.6rem; flex-wrap: wrap; }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--muted);
      }
      .cluster-list { display: grid; gap: 1rem; }
      .cluster-card {
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1rem;
        background: rgba(255,255,255,0.02);
      }
      .word-actions { display: grid; gap: 0.65rem; margin-top: 0.85rem; }
      .word-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 140px 140px;
        gap: 0.6rem;
        align-items: center;
      }
      .status {
        min-height: 1.5rem;
        color: var(--accent);
      }
      .status.error { color: var(--accent-2); }
      .status.success { color: var(--success); }
      @media (max-width: 900px) {
        .grid { grid-template-columns: 1fr; }
        .word-row { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="header">
        <div>
          <p class="muted">Semantic Echo</p>
          <h1>Catalog Admin</h1>
          <p class="muted">Promote fresh suggestions into the live seed without touching JSON by hand.</p>
        </div>
        <div class="chips">
          <span class="chip">Protected admin</span>
          <span class="chip">GitHub-backed</span>
          <span class="chip">Vercel-hosted</span>
        </div>
      </div>

      <div class="grid">
        <div class="stack">
          <section class="panel">
            <h2>Access</h2>
            <p class="muted">Enter the admin secret configured in Vercel.</p>
            <div class="stack">
              <input id="secret" type="password" placeholder="Admin secret" />
              <div class="row">
                <button id="connect">Unlock</button>
                <button id="logout" class="secondary" type="button">Clear</button>
              </div>
            </div>
          </section>

          <section class="panel">
            <h2>Seed Summary</h2>
            <div id="summary" class="muted">Locked.</div>
          </section>

          <section class="panel">
            <h2>Status</h2>
            <div id="status" class="status">Waiting for admin secret.</div>
          </section>
        </div>

        <section class="panel">
          <h2>Suggestions</h2>
          <div id="suggestions" class="cluster-list">
            <p class="muted">Unlock the admin panel to view the current suggestion queue.</p>
          </div>
        </section>
      </div>
    </div>

    <script type="module">
      const secretInput = document.getElementById('secret')
      const connectButton = document.getElementById('connect')
      const logoutButton = document.getElementById('logout')
      const summary = document.getElementById('summary')
      const suggestions = document.getElementById('suggestions')
      const status = document.getElementById('status')
      const storageKey = 'semantic-echo-admin-secret'

      function setStatus(message, variant = '') {
        status.textContent = message
        status.className = variant ? \`status \${variant}\` : 'status'
      }

      function getSecret() {
        return sessionStorage.getItem(storageKey) || ''
      }

      function setSecret(secret) {
        if (!secret) {
          sessionStorage.removeItem(storageKey)
          return
        }

        sessionStorage.setItem(storageKey, secret)
      }

      async function request(url, options = {}) {
        const secret = getSecret()
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': secret,
            ...(options.headers || {}),
          },
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload.error || 'Request failed.')
        }

        return payload
      }

      function renderSummary(state) {
        const chips = [
          \`Version: \${state.seed.version}\`,
          \`Daily words: \${state.catalog.dailyWordCount}\`,
          \`Practice words: \${state.catalog.practiceWordCount}\`,
          \`Suggestions: \${state.suggestions.suggestionCount}\`,
        ]

        summary.innerHTML = \`<div class="chips">\${chips
          .map((chip) => \`<span class="chip">\${chip}</span>\`)
          .join('')}</div>\`
      }

      function renderSuggestions(state) {
        const entries = Object.entries(state.suggestions.suggestionsByCluster || {})

        if (entries.length === 0) {
          suggestions.innerHTML = '<p class="muted">No pending suggestions right now.</p>'
          return
        }

        suggestions.innerHTML = entries
          .map(([cluster, words]) => \`
            <article class="cluster-card">
              <h3>\${cluster}</h3>
              <p class="muted">\${words.length} word(s) ready to promote.</p>
              <div class="word-actions">
                \${words
                  .map(
                    (word) => \`
                      <div class="word-row">
                        <strong>\${word}</strong>
                        <button data-word="\${word}" data-cluster="\${cluster}" data-target="daily">Add to daily</button>
                        <button data-word="\${word}" data-cluster="\${cluster}" data-target="practice">Add to practice</button>
                      </div>
                    \`,
                  )
                  .join('')}
              </div>
            </article>
          \`)
          .join('')

        suggestions.querySelectorAll('button[data-word]').forEach((button) => {
          button.addEventListener('click', async () => {
            const { word, cluster, target } = button.dataset
            button.disabled = true
            setStatus(\`Promoting \${word} into \${target}...\`)

            try {
              const result = await request('/api/admin/promote', {
                method: 'POST',
                body: JSON.stringify({ word, cluster, target }),
              })

              setStatus(result.message, 'success')
              await loadState()
            } catch (error) {
              setStatus(error.message || 'Promotion failed.', 'error')
              button.disabled = false
            }
          })
        })
      }

      async function loadState() {
        try {
          const state = await request('/api/admin/state')
          renderSummary(state)
          renderSuggestions(state)
          setStatus('Admin panel unlocked.', 'success')
        } catch (error) {
          summary.textContent = 'Locked.'
          suggestions.innerHTML =
            '<p class="muted">Unlock the admin panel to view the current suggestion queue.</p>'
          setStatus(error.message || 'Could not load admin state.', 'error')
        }
      }

      connectButton.addEventListener('click', async () => {
        setSecret(secretInput.value.trim())
        await loadState()
      })

      logoutButton.addEventListener('click', () => {
        secretInput.value = ''
        setSecret('')
        summary.textContent = 'Locked.'
        suggestions.innerHTML =
          '<p class="muted">Unlock the admin panel to view the current suggestion queue.</p>'
        setStatus('Admin secret cleared.')
      })

      const bootSecret = getSecret()

      if (bootSecret) {
        secretInput.value = bootSecret
        loadState()
      }
    </script>
  </body>
</html>`

export function GET() {
  return createHtmlResponse(html)
}
