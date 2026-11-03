// Pure initials-entry state (no DOM). Immutable updates; 3 slots cycling A-Z.
export const SLOTS = 3;
const A = 65;

export function createEntry() {
  return { letters: Array(SLOTS).fill('A'), pos: 0 };
}

const withLetter = (e, i, ch) => ({
  ...e,
  letters: e.letters.map((l, j) => (j === i ? ch : l)),
});

// Move the cursor to a slot, clamped.
export function moveCursor(e, dir) {
  return { ...e, pos: Math.max(0, Math.min(SLOTS - 1, e.pos + dir)) };
}

export function setCursor(e, pos) {
  return { ...e, pos: Math.max(0, Math.min(SLOTS - 1, Math.round(pos) || 0)) };
}

// Cycle the letter at the cursor by dir (+1 / -1), wrapping A<->Z.
export function cycleLetter(e, dir) {
  const code = e.letters[e.pos].charCodeAt(0) - A;
  const next = (((code + dir) % 26) + 26) % 26;
  return withLetter(e, e.pos, String.fromCharCode(A + next));
}

// Type a character: letters only; sets the slot and advances the cursor.
export function typeLetter(e, ch) {
  const c = String(ch ?? '').toUpperCase();
  if (!/^[A-Z]$/.test(c)) return e;
  return moveCursor(withLetter(e, e.pos, c), 1);
}

export function backspace(e) {
  return e.pos === 0 ? e : { ...e, pos: e.pos - 1 };
}

export function initialsOf(e) {
  return e.letters.join('');
}
