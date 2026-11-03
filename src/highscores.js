// High-score table logic. Pure functions plus storage helpers that never throw.
export const MAX_SCORES = 10;
export const STORAGE_KEY = 'tempest.highscores';

export function sanitizeInitials(s) {
  const t = String(s ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3);
  return t.padEnd(3, 'A');
}

export function qualifies(table, score, max = MAX_SCORES) {
  if (!(score > 0)) return false;
  return table.length < max || score > table[table.length - 1].score;
}

// Returns a new table: sorted desc, stable for ties (new entry goes after equals), trimmed.
export function insertScore(table, entry, max = MAX_SCORES) {
  const e = { initials: sanitizeInitials(entry.initials), score: Math.floor(entry.score) };
  const out = table.slice();
  let i = out.findIndex((x) => x.score < e.score);
  if (i < 0) i = out.length;
  out.splice(i, 0, e);
  return out.slice(0, max);
}

function validate(data, max) {
  if (!Array.isArray(data)) return [];
  const rows = data
    .filter((r) => r && typeof r === 'object' && Number.isFinite(r.score) && r.score >= 0)
    .map((r) => ({ initials: sanitizeInitials(r.initials), score: Math.floor(r.score) }));
  // Array.prototype.sort is stable.
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, max);
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function load(storage = defaultStorage(), max = MAX_SCORES) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    return validate(JSON.parse(raw), max);
  } catch {
    return [];
  }
}

export function save(table, storage = defaultStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(table));
    return true;
  } catch {
    return false;
  }
}
