# Semantic Echo

Semantic Echo is a daily browser word game where you guess a hidden word and get a warmth score back instead of a spelling clue. The closer your guess is in meaning, the hotter the score gets.

## What makes it fun

- Type anywhere on the page. There is no text box.
- Every guess gets a 0-100 score.
- A heat bar and trend panel show whether you are getting closer.
- Hints build slowly, so they help without instantly giving the game away.
- Practice mode lets you jump into fresh random words after you finish a round.

## How to play

1. Run the app locally:

```bash
npm install
npm run dev
```

2. Open the local Vite URL in your browser.
3. Type letters anywhere on the page.
4. Press `Enter` to submit a guess.
5. Use:
   - `Hint` for a small nudge
   - `Give Up` to reveal the answer
   - `Restart` to replay the same round
   - `Next Word` to jump into practice mode

## Built with

- React 19
- Vite
- Tailwind CSS v4
- Redux Toolkit
- Lucide Icons
- Web Workers

## Project structure

- `src/App.tsx`: app shell, round flow, and UI wiring
- `src/store/*`: Redux state and local storage syncing
- `src/workers/*`: hidden-word logic, scoring, hints, and practice-word selection
- `src/components/*`: main game UI, controls, and HUD
- `src/data/vectors.json`: shipped word list and vector data

## Notes for contributors

- The game uses a worker so the hidden word and scoring logic stay outside the React UI.
- `src/data/vectors.json` is treated as a black box during agent work.
- Practice mode is separate from the daily puzzle so the shared daily word stays intact.

## Deploying

This repo includes a GitHub Pages workflow. Once Pages is enabled to use GitHub Actions, every push to `main` will publish the latest build.
