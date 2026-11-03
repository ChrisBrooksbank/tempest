// Pure difficulty scaling: level -> spawn parameters and enemy type mix.
const UNLOCK = { flipper: 1, tanker: 3, spiker: 5 };

function mixFor(n) {
  const weights = {};
  let total = 0;
  for (const [type, from] of Object.entries(UNLOCK)) {
    // Newly unlocked types ramp in over 3 levels; flipper stays the baseline.
    const w = n < from ? 0 : type === 'flipper' ? 1 : Math.min(1, (n - from + 1) / 3) * 0.6;
    weights[type] = w;
    total += w;
  }
  const mix = {};
  for (const type of Object.keys(weights)) mix[type] = weights[type] / total;
  return mix;
}

export function spawnPlan(level) {
  const n = Math.max(1, Math.floor(level));
  return {
    count: Math.min(6 + 3 * n, 30),
    interval: Math.max(0.5, 1.4 - 0.08 * n),
    maxAlive: 4 + n,
    speed: Math.min(0.55, 0.16 + 0.015 * n),
    mix: mixFor(n),
  };
}

// Pick an enemy type from a mix using rng() in [0,1).
export function pickType(mix, rng = Math.random) {
  let r = rng();
  let last = 'flipper';
  for (const [type, p] of Object.entries(mix)) {
    if (p <= 0) continue;
    last = type;
    if (r < p) return type;
    r -= p;
  }
  return last;
}
