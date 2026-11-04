// Single data table driving per-level difficulty. Figures are hand-tuned (verify against the
// original); edit rows here rather than adding formulas elsewhere.
//   count: enemies spawned   speed: base climb speed   interval: seconds between spawns
//   maxAlive: concurrent cap  unlocks: enemy types that may spawn
//   tankerCargo: what a tanker carries   enemyFire: shots/sec per firing enemy (0 = none)
const F = ['flipper'];
const FT = ['flipper', 'tanker'];
const FTS = ['flipper', 'tanker', 'spiker'];
const ALL = ['flipper', 'tanker', 'spiker', 'pulsar'];

export const LEVEL_TABLE = [
  {
    count: 9,
    speed: 0.175,
    interval: 1.32,
    maxAlive: 5,
    unlocks: F,
    tankerCargo: 'flipper',
    enemyFire: 0,
  },
  {
    count: 12,
    speed: 0.19,
    interval: 1.24,
    maxAlive: 6,
    unlocks: F,
    tankerCargo: 'flipper',
    enemyFire: 0,
  },
  {
    count: 15,
    speed: 0.205,
    interval: 1.16,
    maxAlive: 7,
    unlocks: FT,
    tankerCargo: 'flipper',
    enemyFire: 0.05,
  },
  {
    count: 18,
    speed: 0.22,
    interval: 1.08,
    maxAlive: 8,
    unlocks: FT,
    tankerCargo: 'flipper',
    enemyFire: 0.07,
  },
  {
    count: 21,
    speed: 0.235,
    interval: 1.0,
    maxAlive: 9,
    unlocks: FTS,
    tankerCargo: 'flipper',
    enemyFire: 0.09,
  },
  {
    count: 24,
    speed: 0.25,
    interval: 0.92,
    maxAlive: 10,
    unlocks: FTS,
    tankerCargo: 'flipper',
    enemyFire: 0.11,
  },
  {
    count: 27,
    speed: 0.265,
    interval: 0.84,
    maxAlive: 11,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.13,
  },
  {
    count: 30,
    speed: 0.28,
    interval: 0.76,
    maxAlive: 12,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.15,
  },
  {
    count: 30,
    speed: 0.295,
    interval: 0.68,
    maxAlive: 13,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.17,
  },
  {
    count: 30,
    speed: 0.31,
    interval: 0.6,
    maxAlive: 14,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.19,
  },
  {
    count: 30,
    speed: 0.325,
    interval: 0.52,
    maxAlive: 15,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.21,
  },
  {
    count: 30,
    speed: 0.34,
    interval: 0.5,
    maxAlive: 16,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.23,
  },
  {
    count: 30,
    speed: 0.355,
    interval: 0.5,
    maxAlive: 17,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.25,
  },
  {
    count: 30,
    speed: 0.37,
    interval: 0.5,
    maxAlive: 18,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.27,
  },
  {
    count: 30,
    speed: 0.385,
    interval: 0.5,
    maxAlive: 19,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.29,
  },
  {
    count: 30,
    speed: 0.4,
    interval: 0.5,
    maxAlive: 20,
    unlocks: ALL,
    tankerCargo: 'flipper',
    enemyFire: 0.3,
  },
];

// Base points per enemy type (no per-level scaling, no flat level bonus).
export const POINTS = { flipper: 150, tanker: 100, spiker: 50, fuseball: 250, pulsar: 200 };

// Levels past the end of the table keep the final (hardest) row.
export function levelRow(level) {
  const n = Math.max(1, Math.floor(level) || 1);
  return LEVEL_TABLE[Math.min(n, LEVEL_TABLE.length) - 1];
}

// First level (1-based) at which a type is unlocked, or Infinity.
export function unlockLevel(type) {
  const i = LEVEL_TABLE.findIndex((r) => r.unlocks.includes(type));
  return i < 0 ? Infinity : i + 1;
}
