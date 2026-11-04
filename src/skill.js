// Skill select: pure start-level options + bonus, and persisted "highest level reached".
const STORAGE_KEY = 'tempest.highestLevel';
export const BONUS_PER_LEVEL = 500;
export const MAX_START = 15;

// Start levels offered: 1, then every odd level (3, 5, 7...) up to the highest reached.
export function startOptions(highestReached) {
  const top = Math.min(MAX_START, Math.max(1, Math.floor(Number(highestReached)) || 1));
  const opts = [1];
  for (let l = 3; l <= top; l += 2) opts.push(l);
  return opts;
}

// Score awarded for skipping ahead to `level` (0 for level 1).
export function startBonus(level) {
  const n = Math.floor(Number(level)) || 1;
  return Math.max(0, n - 1) * BONUS_PER_LEVEL;
}

// Move the selection by d within the options, clamped; returns the new level.
export function cycleStart(options, current, d) {
  const i = Math.max(0, options.indexOf(current));
  return options[Math.max(0, Math.min(options.length - 1, i + d))];
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadHighest(storage = defaultStorage()) {
  try {
    const v = Math.floor(Number(storage?.getItem(STORAGE_KEY)));
    return Number.isFinite(v) && v >= 1 ? Math.min(v, 999) : 1;
  } catch {
    return 1;
  }
}

// Persists only if `level` exceeds the stored value. Returns the resulting highest level.
export function saveHighest(level, storage = defaultStorage()) {
  const cur = loadHighest(storage);
  if (!(level > cur)) return cur;
  try {
    storage?.setItem(STORAGE_KEY, String(Math.floor(level)));
  } catch {
    return cur;
  }
  return Math.floor(level);
}
