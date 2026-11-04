# Implementation Plan

## Status

- Planning iterations: 4 (added Phase 6 for specs/arcade-fidelity.md; verified against src/: no shots, fuseball, warp, 2nd zap, skill select exist; bullets cap is 6 in main.js; scoring.js still has per-level scaling + flat bonus)
- Build iterations: 26 (Phases 0-5 done; Phase 6 in progress)
- Last updated: 2026-11-04

## Tasks

Priority order; one task = one build iteration. Run `npm run check` before finishing each.

### Phase 0 - Tooling & module extraction
- [x] 1. Add package.json (`type: module`), Vitest, ESLint (flat config, browser globals), Prettier, and scripts `test`, `test:run`, `lint`, `format:check`, `check` (lint + format:check + test:run). Add one trivial passing test so `check` is green. Add .gitignore (node_modules). (spec: all; AGENTS.md)
- [x] 2. Move the inline script out of index.html into `src/main.js` loaded via `<script type="module">`; behaviour unchanged. Create `src/` layout: `web.js`, `scoring.js`, `difficulty.js`, `enemies.js`, `highscores.js`, `audio.js`, `levels.js`. Update README/AGENTS run note (modules need a static server, `npx serve .`; file:// won't work). (spec: all)

### Phase 1 - Pure logic, with tests
- [x] 3. Extract web geometry into `src/web.js`: `build(shape)`, `step(web, lane, d)`, `wdiff(web, a, b)`, `dirTo`, `startLane`. Take `web` as a parameter (no globals). Tests: lane counts per shape, closed wrap, open clamp at both edges, wdiff shortest path, startLane. (spec: webs-levels.md)
- [x] 4. `src/levels.js`: `levelConfig(level)` returning `{shapeIndex, color, loop}`; shapes cycle, levels past last shape loop with `loop` count (feeds difficulty). Move SHAPES/COLORS to `src/shapes.js`. Tests for mapping incl. wraparound. (spec: webs-levels.md)
- [x] 5. Add >=3 new shapes (star, heart, figure-eight, steps) to `src/shapes.js`. Test: every shape builds, has no NaN points, lanes >= 8, normalised to |coord| <= 1, no duplicate adjacent points. Visually check at 3 viewport sizes. (spec: webs-levels.md)
- [x] 6. `src/difficulty.js`: pure `spawnPlan(level)` -> `{count, interval, maxAlive, speed, mix:{flipper,tanker,spiker,...}}` replacing the inline formulas (current: count `min(6+3n,30)`, interval `max(.5,1.4-.08n)`, maxAlive `4+n`, speed `min(.55,.16+.015n)`). Type mix unlocks by level (flipper L1, tanker ~L3, spiker ~L5, etc.); level 1 stays flipper-only/easy. Tests: monotonic scaling, caps, level 1 values, mix sums to 1. (spec: gameplay-enemies.md)
- [x] 7. `src/collision.js`: pure `bulletHits(enemy, bullet)` and `clawHit(enemy, playerLane)` extracted from update() (flip.t > .5 counts as target lane; |dz| < .07; rim contact when z>=1 and not flipping). Tests for both. (spec: gameplay-enemies.md)
- [x] 8. `src/scoring.js`: `pointsFor(type, level)`, `levelBonus(level)`, `extraLivesEarned(prev, next)` (threshold e.g. every 20000). Wire into game (replace hardcoded 150; award extra life + HUD). Tests. (spec: scoring-persistence.md)
- [x] 9. `src/highscores.js`: pure `insertScore(table, entry, max=10)` (sort desc, stable for ties, trim), `qualifies(table, score)`, `sanitizeInitials`; plus `load()/save()` with every localStorage access in try/catch and validation of parsed data. Tests incl. throwing storage stub and corrupt JSON. (spec: scoring-persistence.md)

### Phase 2 - Gameplay
- [x] 10. Refactor enemy code in `src/enemies.js` into a per-type table `{update, draw, onKill, score}`; existing behaviour becomes the `flipper` type. Entities carry `type`. Keep behaviour identical (no tests broken). (spec: gameplay-enemies.md)
- [x] 11. Tanker: slower, thicker, on death splits into two flippers on adjacent lanes. Distinct shape/colour. Tests for split lanes (clamp/wrap aware). (spec: gameplay-enemies.md)
- [x] 12. Spiker: travels to rim-ward depth, lays a spike on its lane that blocks/hurts and is shortened by shots; retreats. Distinct visual. Tests for spike length logic. (spec: gameplay-enemies.md)
- [x] 13. Third+ type (e.g. fuseball/pulsar that rides lane edges or electrifies lane) to give >=4 types total; wire into `spawnPlan` mix. (spec: gameplay-enemies.md)
- [x] 14. Superzapper: one smart bomb per level (key `Z`/`X` or on-screen button), kills all enemies on screen, with flash. Scored via scoring.js. (spec: gameplay-enemies.md Out of Scope: only power-up allowed)
- [x] 15. Level flow polish: guard against input lock-up in "in"/"out"/"dead" phases (clear held state, ensure `press()` can't deadlock), clean zoom-through with fading enemies/spikes, loop difficulty after last shape. Add a test of phase-transition state machine if extracted. (spec: webs-levels.md)

### Phase 3 - Scoring UI & persistence
- [x] 16. HUD: score, lives, level number, high score; high-score table on title screen. (spec: scoring-persistence.md)
- [x] 17. Initials entry on game over for qualifying scores: keyboard (arrows/letters + Enter) and touch/pointer friendly; save via highscores.js. Existing KEYS map must not swallow letters during entry. (spec: scoring-persistence.md)

### Phase 4 - Audio & effects
- [x] 18. `src/audio.js`: mute state module (`isMuted`, `toggle`, load/save with try/catch localStorage), `sfx()` no-op when muted or when AudioContext unavailable (no console errors). Tests for mute logic with stubbed storage. (spec: audio-effects.md)
- [x] 19. Distinct SFX presets: fire, kill (per type), player death, level clear, extra life. Keep lazy `wake()` on first gesture. (spec: audio-effects.md)
- [x] 20. Mute control: M key + on-screen button (pointer-accessible), persisted. (spec: audio-effects.md)
- [x] 21. Particle tuning per event, cap max particles (pool/limit) for smooth frames, screen shake on death; honour `prefers-reduced-motion` (reduce shake/flash). Pure helper for particle cap + shake amplitude is tested. (spec: audio-effects.md)

### Phase 5 - Verification
- [x] 22. Playwright smoke test (optional, per cb-visual-qa): each shape renders at 3 viewports, no console errors, canvas non-blank. Only if it doesn't bloat deps. (spec: webs-levels.md) **Skipped (optional): Playwright + browser download would bloat deps; existing Vitest tests (shapes.test.js, smoke.test.js) cover shape validity.**
- [x] 23. Final pass: README controls/roadmap update, confirm all spec checkboxes and acceptance criteria, `npm run check` green.

### Phase 6 - Arcade fidelity (spec: specs/arcade-fidelity.md)
- [x] 24. `src/leveltable.js`: single data table per level `{count, speed, interval, maxAlive, unlocks, tankerCargo, enemyFire}` replacing `spawnPlan` formulas (keep `spawnPlan` as the API). Levels 1-2 flipper-only, no fire. Remove per-level point scaling and flat level bonus from `scoring.js` (keep values in a table). Tests: lookup, monotonic caps, L1/L2 invariants, loops past table end.
- [x] 25. Enemy shots: pure `src/shots.js` (`fireChance`, `stepShots`, `shotHitsClaw`) - flippers/tankers fire down their lane at a table-driven rate; bullets travel z 0->1, kill the claw on the rim, and the player can shoot them. Draw + SFX. Tests with injected rng.
- [x] 26. Fuseball: new type in `enemies.js`; hops between lane edges while climbing, rides the rim, only shootable while on a lane; score 250/500/750 by depth. Add to table unlocks. Tests for movement + scoring bands.
- [x] 27. Tanker cargo (flipper/fuseball/pulsar by table) and split-at-top behaviour in `onKill`/`update`. Distinct tint per cargo. Tests.
- [x] 28. Level-end warp dive: new `warp` phase after clear; claw descends the web, player steers lane to lane, any spike on its lane kills it (lose a life, replay the level clear); spikes no longer lethal during `run`. Dive bonus. Update `phases.js` + tests.
- [x] 29. Superzapper second use: first press clears all, second kills one random enemy, then spent. Update `superzapper.js`, HUD indicator, tests. Raise max bullets to 8.
- [ ] 30. Web set: grow `SHAPES` to 16 (mix closed/open, target 16 lanes), fix colour-per-lap in `levelConfig`. Extend shape validity tests; visually check at 3 viewport sizes.
- [ ] 31. Skill select: title-screen start-level chooser (e.g. 1,3,5,7,9...) via keys/pointer, start bonus score, `begin(level)`. Pure `startOptions(highestReached)` + `startBonus(level)` with tests.
- [ ] 32. Polish: pause (P/Esc, auto-pause on blur), GAME OVER text, attract-mode demo on title (AI plays), smoother control feel (accelerating key-repeat, pointer glide), optional Gamepad API axis/button mapping. Keep keyboard + pointer working.
- [ ] 33. Final pass: README roadmap, tick specs/arcade-fidelity.md boxes, `npm run check` green.

## Completed

<!-- Completed tasks move here -->

## Notes

### Audit of existing code (index.html, 401 lines, single inline script)
- Shapes: 5 (circle 16 lanes closed, square 16 closed, cross 12 closed, flat 14 open, V 14 open). Colours: 6 in COLORS, cycle by `(level-1)%len`; shape cycles `(level-1)%5`. Levels past 5 already loop shape/colour; difficulty already scales with level via inline formulas.
- Enemies: ONE type only (flipper). Climbs z 0->1 at speed `min(.55,.16+.015n)*(0.8..1.2)`, randomly flips to adjacent lane every .5-1.7s; at rim (z=1) flips toward player every .16s and kills on contact if not flipping and same lane. No tankers, spikers, enemy shots, or smart bomb.
- Scoring: flat 150/kill, no level bonus, no extra lives, no persistence, no high-score UI, HUD shows score + lives only.
- Audio: lazy `wake()` + `sfx(f0,f1,d,type,v)` oscillator; no mute, no per-event presets; `ac` null => sfx no-ops (but `new AudioContext` is try/caught).
- Effects: sparks only (unbounded count, no cap), no shake, no reduced-motion handling.
- Globals everywhere (`web`, `R`, `cx`...); `step/wdiff/dirTo/startLane` read global `web` - must be parameterised when extracting.
- Test hooks: `cv.dataset.state` and `cv.dataset.score` are set in setState/setScore - keep them (used for external/visual tests).
- Input: KEYS map + pointer events; fire on Enter/Space/arrows-up/down/W/S. Keep both working.

### Architectural decisions
- ES modules under `src/` (no bundler, no build step); `index.html` loads `src/main.js` as a module. Pure logic modules take state as parameters and never touch DOM/window/localStorage directly (storage injected for testability). Canvas/audio/input stay in `main.js` / thin `render.js`.
- Tests live in `tests/*.test.js` (Vitest, node environment).
- Randomness in pure logic: accept an `rng` parameter (default Math.random) so tests are deterministic.
- Level 1 must remain beatable: keep flipper-only and current-or-easier parameters for level 1-2.
- Keep file under AGENTS.md rule: add learnings there (keep <60 lines).
