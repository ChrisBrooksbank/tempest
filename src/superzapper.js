// Pure superzapper rules: one smart bomb per level that kills every enemy.
import { ENEMY_TYPES } from './enemies.js';

export function canZap(zapsLeft, ents) {
  return zapsLeft > 0 && ents.length > 0;
}

// Kills all enemies (no tanker splitting). Returns the points earned.
export function superzap(ents, level) {
  let points = 0;
  for (const e of ents) points += (ENEMY_TYPES[e.type] ?? ENEMY_TYPES.flipper).score(level);
  return { points, killed: ents.length };
}
