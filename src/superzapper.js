// Pure superzapper rules: first use per level kills every enemy, the second kills one random enemy.
import { ENEMY_TYPES } from './enemies.js';

export const ZAPS_PER_LEVEL = 2;

export function canZap(zapsLeft, ents) {
  return zapsLeft > 0 && ents.length > 0;
}

// No tanker splitting. Returns points, how many died, and who died / survived.
export function superzap(ents, level, zapsLeft = ZAPS_PER_LEVEL, rng = Math.random) {
  let victims = ents;
  let survivors = [];
  if (zapsLeft < ZAPS_PER_LEVEL && ents.length > 0) {
    const i = Math.min(ents.length - 1, Math.floor(rng() * ents.length));
    victims = [ents[i]];
    survivors = ents.filter((_, j) => j !== i);
  }
  let points = 0;
  for (const e of victims) points += (ENEMY_TYPES[e.type] ?? ENEMY_TYPES.flipper).score(level);
  return { points, killed: victims.length, victims, survivors };
}
