// Pure HUD helpers (no DOM/canvas).
export function bestScore(table, score) {
  const top = table.length ? table[0].score : 0;
  return Math.max(top, score);
}

// Rows for the title-screen table: "1. ABC  12345", capped at `max`.
export function tableLines(table, max = 10) {
  return table
    .slice(0, max)
    .map((r, i) => `${String(i + 1).padStart(2)}. ${r.initials} ${String(r.score).padStart(7)}`);
}
