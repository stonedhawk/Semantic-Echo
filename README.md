# 🌌 Semantic Echo

[![GitHub stars](https://img.shields.io/github/stars/stonedhawk/Semantic-Echo.svg?style=flat-square)](https://github.com/stonedhawk/Semantic-Echo/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev)
[![Redux Toolkit](https://img.shields.io/badge/Redux-Toolkit-purple.svg?style=flat-square&logo=redux)](https://redux-toolkit.js.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-yellow.svg?style=flat-square&logo=vite)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

**Semantic Echo** is a captivating, next-generation daily word game where you guess a hidden target word. Instead of standard spelling clues (like Wordle's correct/incorrect letters), you receive a **semantic warmth score** indicating how close your guess is in *meaning*!

> [!TIP]
> **Think conceptually!** If the secret word is **forest**, a guess like *tree* or *river* will get a scorching hot score (~90+), while spelling-similar words like *force* or *forests* will be ice cold if they drift in meaning.

---

## 🎮 How to Play

We've designed Semantic Echo to be completely intuitive and zero-friction. 

### 1. The Core Rules
* **No Input Box Needed:** The entire screen is your canvas. Simply start typing letters anywhere on the page!
* **Length Limit:** Guesses can be up to 24 letters long.
* **Warmth Meter (0 - 100):** Every submitted guess receives a warmth score. 
  * **90+ (Ember/Red):** You're practically touching the target! Try close synonyms or adjacent concepts.
  * **60 - 89 (Warm/Orange):** You are in the right semantic neighborhood.
  * **30 - 59 (Mild/Grey):** Slightly relevant, but too generic.
  * **0 - 29 (Cold/Blue):** Completely off-track. Try a different semantic direction.

### 2. Controls & Navigation
* **`Backspace`:** Delete the last character.
* **`Enter`:** Submit your guess.
* **`Hint`:** Request a gradual clue (up to 5 levels). Each hint gives you helpful guideposts (e.g. word length, starting letter, synonym cluster) but caps your maximum score for that guess to keep the challenge alive.
* **`Give Up`:** Instantly reveal today's hidden word.
* **`Restart`:** Clear your board and retry the current puzzle from scratch.
* **`Next Word`:** Finished today's puzzle? Jump into **Practice Mode** with unlimited, fresh random words to hone your skills!

---

## ⚡ High-Performance Dictionary Integration

Semantic Echo integrates the cutting-edge, pre-compiled word validation library:
### [📦 @rahulmrx/game-ready-dictionary](https://github.com/stonedhawk/game-ready-dictionary)

By incorporating this high-performance Trie-based package, the game offers a state-of-the-art UX:

1. **Intelligent Typos Checking (Synchronous):** The frontend React UI runs pre-flight validation on every guess *instantly* (~0.0001ms). If you make a typo or enter gibberish (e.g., *asdfasdf*), it immediately flags it as `"Not a valid English word! Check your spelling."` without consuming scoring attempts.
2. **Obscure Word Rejection:** If you type a valid English word that is outside our core high-dimensional embedding space, the UI provides a friendly and specific message: `"Valid word, but too obscure or missing semantic data! Try a different synonym."`
3. **Cross-Platform Suggestions Pipeline:** In our server/catalog pipeline, we've replaced OS-specific dictionaries (like `/usr/share/dict/words`) with `game-ready-dictionary`'s pre-compiled Trie, making suggestion builds 100% environment-agnostic, enabling suggestions to run perfectly on serverless hosters (like Vercel) or local Windows/macOS machines.

---

## 🛠️ Built With

* **React 19** & **TypeScript** - Modular component architecture and rock-solid type safety.
* **Redux Toolkit** - Global state engine managing guess histories, persistent localStorage sessions, and worker states.
* **Tailwind CSS v4** - Curated aesthetic token engine.
* **Lucide Icons** - Exquisite, clean micro-interactions.
* **Web Workers** - The entire embedding calculation and daily-word resolver operates inside a background Web Worker so the main UI remains buttery smooth.

---

## 📂 Project Structure

```text
├── api/                             # Vercel Serverless API endpoints
│   ├── _lib/                        # Admin & catalog parsing libraries
│   └── admin/                       # Content manager promotion endpoints
├── catalog/                         # Human-curated daily & practice seeds
│   ├── wordCatalog.seed.json        # Categorized buckets of target words
│   └── wordCatalog.suggestions.json # Clean recommendations queue
├── scripts/                         # Automated build & rotation scripts
│   ├── build-word-catalog.mjs       # Validates seed words and creates front-end catalog
│   └── build-catalog-suggestions.mjs# Generates suggestions using game-ready-dictionary
├── src/
│   ├── App.tsx                      # App shell and global event handlers
│   ├── components/                  # Sleek glassmorphism components
│   │   ├── CurrentBuffer.tsx        # Typing canvas and interactive tooltip
│   │   ├── TrajectoryHUD.tsx        # Trend analysis and metric cards
│   │   └── GuessList.tsx            # Guess history with warmth score visualizer
│   ├── data/
│   │   ├── vectors.json             # shippable word embeddings (vector dataset)
│   │   └── wordCatalog.json         # generated active frontend playable catalog
│   └── workers/
│       ├── vectorWorker.ts          # high-performance calculation thread
│       └── vectorWorkerClient.ts    # asynchronous Worker dispatcher
```

---

## 🚀 Running Locally

Get the application up and running on your local machine in under a minute:

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm run dev
```
Open the local URL displayed in the terminal (usually `http://localhost:5173`) in your browser and start playing!

---

## 🌍 Remote Catalog & Vercel API

Semantic Echo is built to support a decoupled backend catalog, meaning you can refresh target words without rebuilding the frontend game client.

### Pipeline Commands
* **`npm run catalog:build`**: Translates the seed file `catalog/wordCatalog.seed.json` into optimized JSON lists.
* **`npm run catalog:suggest`**: Cross-references our embedding vectors with the **Game-Ready Dictionary** to suggest excellent new puzzle words that are guaranteed to have valid vectors.
* **`npm run catalog:refresh`**: Executes both build and suggestion runs in sequence.
* **`npm run catalog:promote -- --word <word> --cluster <cluster> --target <daily|practice>`**: Automatically appends a word from suggestions into the active seed bucket.

### Vercel Serverless Integration
We have shipped Vercel API routes in `api/` which serve the active word lists and provide a password-protected admin portal for catalog promotion. 

To enable the secure remote administration features, configure these environment variables on Vercel:
```bash
CATALOG_ADMIN_SECRET=your-secure-password
CATALOG_GITHUB_TOKEN=github-classic-token-with-repo-write
CATALOG_GITHUB_REPO_OWNER=stonedhawk
CATALOG_GITHUB_REPO_NAME=Semantic-Echo
CATALOG_GITHUB_REPO_BRANCH=main
```

---

## 📄 License

Semantic Echo is open-source software licensed under the [MIT License](LICENSE).
Boasts-credit goes to [@rahulmrx/game-ready-dictionary](https://github.com/stonedhawk/game-ready-dictionary) for providing the high-speed word validation dictionary engine!
