// Pure scoring rules; no DOM or globals.
export const EXTRA_LIFE_EVERY = 20000;

const POINTS = { flipper: 150, tanker: 100, spiker: 50, fuseball: 250, pulsar: 200 };

export function pointsFor(type = 'flipper', level = 1) {
  const base = POINTS[type] ?? POINTS.flipper;
  return base + 10 * Math.max(0, Math.floor(level) - 1);
}

export function levelBonus(level) {
  return 500 * Math.max(1, Math.floor(level));
}

// Number of extra lives crossed when going from prev to next score.
export function extraLivesEarned(prev, next, every = EXTRA_LIFE_EVERY) {
  return Math.max(0, Math.floor(next / every) - Math.floor(prev / every));
}
