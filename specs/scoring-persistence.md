# Scoring & Persistence

## Overview

Players see their score, lives and a high-score table that survives page reloads.

## User Stories

- As a player, I want my best scores saved so that I can try to beat them
- As a player, I want a clear lives/score/level HUD so that I know my status

## Requirements

- [ ] Score awarded per enemy type and level bonus, via a pure scoring function
- [ ] Extra life at score thresholds
- [ ] Top-10 high-score table persisted in localStorage (every access wrapped in try/catch)
- [ ] Initials entry on game over for qualifying scores (keyboard and touch friendly)
- [ ] High scores shown on the title screen

## Acceptance Criteria

- [ ] Scoring and high-score insert/sort/trim logic unit-tested
- [ ] Storage failure (private mode) never crashes the game
- [ ] Scores persist across reload

## Out of Scope

- Online leaderboards or accounts
