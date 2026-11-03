# Audio & Visual Effects

## Overview

The game feels punchy through synthesized sound and vector-style visual juice.

## User Stories

- As a player, I want satisfying sound and effects so that actions have impact
- As a player, I want to mute audio so that I can play quietly

## Requirements

- [ ] Distinct synthesized SFX for fire, kill, player death, level clear, extra life (extend existing sfx())
- [ ] Particle bursts and glow tuned per event; screen shake on player death
- [ ] Mute toggle (M key and on-screen control) persisted in localStorage
- [ ] Respect prefers-reduced-motion by reducing shake/flash
- [ ] Audio only starts after the first user gesture

## Acceptance Criteria

- [ ] Mute state logic is unit-tested; sfx calls are no-ops when muted
- [ ] No console errors when AudioContext is unavailable
- [ ] Frame rate stays smooth with maximum particles

## Out of Scope

- Music tracks or sampled audio files
