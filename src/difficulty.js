// Pure difficulty lookup: level -> spawn parameters and enemy type mix (data in leveltable.js).
import { levelRow, unlockLevel } from './leveltable.js';

function mixFor(n, unlocks) {
  const weights = {};
  let total = 0;
  for (const type of unlocks) {
    // Newly unlocked types ramp in over 3 levels; flipper stays the baseline.
    const w = type === 'flipper' ? 1 : Math.min(1, (n - unlockLevel(type) + 1) / 3) * 0.6;
    weights[type] = w;
    total += w;
  }
  const mix = { flipper: 0, tanker: 0, spiker: 0, pulsar: 0 };
  for (const type of unlocks) mix[type] = weights[type] / total;
  return mix;
}

export function spawnPlan(level) {
  const n = Math.max(1, Math.floor(level) || 1);
  const row = levelRow(n);
  return {
    count: row.count,
    interval: row.interval,
    maxAlive: row.maxAlive,
    speed: row.speed,
    tankerCargo: row.tankerCargo,
    enemyFire: row.enemyFire,
    mix: mixFor(n, row.unlocks),
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
