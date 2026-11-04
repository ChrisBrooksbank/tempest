# Arcade Fidelity (vs. Atari Tempest, 1981)

## Overview

Gap analysis between this clone and the original arcade game, and the requirements to close the
important gaps. Figures marked (verify) come from memory of the original and should be checked
against a reference (MAME / Atari docs / strategy guides) before being hard-coded; put all such
numbers in one data table so they are cheap to correct.

## What already matches

Closed webs wrap, open webs clamp; claw on the rim; enemies climb from the centre; flipper, tanker
(splits into 2 flippers), spiker (lays spikes), pulsar; superzapper; extra life every 20,000;
high-score table with initials; vector/neon look with phosphor trail; per-event SFX.

## Gaps (ordered by gameplay impact)

| #   | Area               | Original                                                                                                                                        | This clone                                                                                | Impact |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| 1   | Enemy fire         | Flippers, tankers etc. shoot down their lane toward the rim; shots kill the claw on contact, and can be shot (verify)                           | No enemy projectiles at all                                                               | High   |
| 2   | Fuseball           | Fifth enemy: moves along the rim edges and up lanes in zig-zags; only shootable when on a lane; 250/500/750 pts by depth                        | Not implemented (`POINTS.fuseball` exists but no type)                                    | High   |
| 3   | Tanker variants    | Tankers carry flippers, fuseballs or pulsars depending on level; split when they reach the top as well as when shot (verify)                    | Flipper cargo only; splits only when shot                                                 | Med    |
| 4   | Level-end warp     | After clearing, the claw flies down the web; remaining spikes in your lane kill you, so you steer to a clean lane. Bonus for the dive           | Spikes kill you during normal play when long; `out` phase is a passive zoom with no steer | High   |
| 5   | Superzapper        | First use per level clears the screen; a second use kills one enemy (verify)                                                                    | Single use only                                                                           | Med    |
| 6   | Web set            | 16 webs (mixed closed/open, mostly 16 lanes), cycling with colour changes on later laps                                                         | 9 webs, lane counts vary 8-24; colours cycle independently                                | Med    |
| 7   | Level start        | "Rate yourself" skill select to start on a later level, with a start bonus                                                                      | Always starts at level 1                                                                  | Med    |
| 8   | Difficulty tables  | Per-level hand-tuned table (enemy counts, speeds, which types appear); new types enter at specific levels (verify)                              | Smooth formulas; pulsar at L7, no fuseball; points scale +10/level (original has no scale) | Med    |
| 9   | Scoring            | Flipper 150, tanker 100, spiker 50, pulsar 200, fuseball 250-750; no per-level scaling; no flat `500*level` bonus (verify)                      | Scaled values; flat level bonus                                                           | Low    |
| 10  | Player shots       | Up to 8 shots on screen                                                                                                                         | Max 6                                                                                     | Low    |
| 11  | Control feel       | Analog spinner: fast, precise, continuous                                                                                                       | Discrete 85 ms key repeat; pointer snaps lane by lane at 35 ms                            | Low    |
| 12  | Attract / chrome   | Attract-mode demo, GAME OVER screen, pause                                                                                                      | Title shows scores only; no pause; no GAME OVER text                                      | Low    |
| 13  | Input              | Spinner + fire + zapper buttons                                                                                                                 | Keyboard + pointer; no gamepad / wheel mapping                                            | Low    |

## Requirements

- [ ] Enemy projectiles exist, are pure/testable, kill the claw, and scale in by level
- [ ] Fuseball enemy implemented with rim/lane movement and depth-based scoring
- [ ] Tanker cargo varies by level; tankers also split on reaching the top
- [ ] Level end is an interactive warp dive where spikes are the hazard (not lethal during play)
- [ ] Superzapper second use kills a single enemy
- [ ] 16 webs, normalised to 16 lanes where the shape allows, with a fixed colour per lap
- [ ] Skill-select start level with start bonus
- [ ] One data table drives per-level enemy counts/speeds/unlocks and scoring values

## Acceptance Criteria

- [ ] Unit tests cover enemy shots, fuseball movement/scoring, tanker cargo, warp collision, zapper uses, level table lookups, start-level bonus
- [ ] `npm run check` passes
- [ ] Level 1-2 remain beatable by a new player (flipper-only, no enemy fire)
- [ ] Neon vector aesthetic and keyboard + pointer input are unchanged

## Out of Scope

- Multiplayer / two-player alternation
- Exact ROM-accurate timing and enemy AI
- Cabinet-specific features (coin logic, service menus)
