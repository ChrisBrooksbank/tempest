# Gameplay & Enemies

## Overview

Players face a varied, escalating set of enemies that demand different tactics.

## User Stories

- As a player, I want distinct enemy types so that each level feels different
- As a player, I want difficulty to ramp fairly so that I stay challenged without being overwhelmed

## Requirements

- [ ] Audit existing enemy behaviour in index.html and document it in the plan
- [ ] Add at least 3 distinct enemy types (e.g. flipper, tanker, spiker) with different movement/attack rules
- [ ] Spawn rate, speed and type mix scale with level via a pure, testable function
- [ ] Enemy/bullet collision and lane-stepping logic is unit-testable without a DOM

## Acceptance Criteria

- [ ] Unit tests cover spawn scaling and collision logic
- [ ] Each enemy type is visually distinct and behaves per its rule
- [ ] Level 1 remains beatable by a new player

## Out of Scope

- Multiplayer
- Power-ups beyond a single superzapper-style smart bomb
