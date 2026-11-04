// Pure collision checks; web is passed in, no globals.
import { step } from './web.js';

// Lane an enemy effectively occupies for shots: past the halfway point of a flip it counts as the target lane.
export function effectiveLane(web, enemy) {
  return enemy.flip && enemy.flip.t > 0.5 ? step(web, enemy.lane, enemy.flip.d) : enemy.lane;
}

export function bulletHits(web, enemy, bullet) {
  if (enemy.onLane === false) return false; // fuseball riding a lane edge can't be shot
  return effectiveLane(web, enemy) === bullet.lane && Math.abs(enemy.z - bullet.z) < 0.07;
}

// Enemy at the rim, not mid-flip, on the player's lane.
export function clawHit(enemy, playerLane) {
  return enemy.z >= 1 && !enemy.flip && enemy.lane === playerLane;
}
