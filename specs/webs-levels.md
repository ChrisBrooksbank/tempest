# Webs & Levels

## Overview

Players progress through a sequence of differently shaped webs with clear level transitions.

## User Stories

- As a player, I want a new web shape and colour each stage so that progress feels rewarding
- As a player, I want a smooth transition between levels so that I can reset mentally

## Requirements

- [ ] Existing 5 shapes (circle, square, cross, flat, V) cycle with colours from COLORS
- [ ] Add at least 3 more shapes (e.g. star, heart, figure-eight, steps)
- [ ] Level-to-web/colour mapping is a pure function covered by tests
- [ ] Zoom-through transition between levels is polished and never locks up input
- [ ] Open webs clamp at the edges; closed webs wrap, verified by tests

## Acceptance Criteria

- [ ] Web geometry (build, lane count, wrapping/clamping) has unit tests
- [ ] Every shape renders without overlap or NaN at several viewport sizes
- [ ] Levels beyond the last shape loop with increased difficulty

## Out of Scope

- A level editor
