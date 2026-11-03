# AGENTS.md - Operational Guide

Keep this file under 60 lines. It's loaded every iteration.

## Project

Tempest clone: single-file canvas game in `index.html` (vanilla JS, no build step, no deps yet).
Goal: polish & extend the game. Done = all tests pass + each spec's acceptance criteria met.

## Build / Run

```bash
npx serve .            # or open index.html directly in a browser
```

## Test Commands

No tooling exists yet. The FIRST plan task is to add it (package.json, Vitest, ESLint,
Prettier). Pure game logic (web geometry, lane stepping, scoring, spawn/difficulty)
should be extracted into modules testable without a DOM; canvas/audio code stays thin.

```bash
npm test               # Vitest watch
npm run test:run       # Vitest once
```

## Validation (run before finishing a task)

```bash
npm run check          # lint + format check + tests (create this script in task 1)
```

## Project Notes

- Keep the game playable from a static server; avoid heavy build steps unless a spec says so.
- Vector/neon look: canvas strokes with shadowBlur glow; keep that aesthetic.
- Input: keyboard (KEYS map) and pointer; don't break either.
- Audio uses Web Audio `sfx()`, lazily woken on first input (browser autoplay rules).
- Learnings from iterations go below:
