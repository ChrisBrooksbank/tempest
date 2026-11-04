// Pure scoring rules; no DOM or globals.
import { POINTS } from './leveltable.js';

export const EXTRA_LIFE_EVERY = 20000;

export function pointsFor(type = 'flipper') {
  return POINTS[type] ?? POINTS.flipper;
}

// Number of extra lives crossed when going from prev to next score.
export function extraLivesEarned(prev, next, every = EXTRA_LIFE_EVERY) {
  return Math.max(0, Math.floor(next / every) - Math.floor(prev / every));
}
