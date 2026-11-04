// Pure enemy-shot logic: flippers/tankers fire down their lane toward the rim.
// Shots travel z 0 -> 1 (web centre to rim); a shot arriving on the claw's lane kills it,
// and player bullets can destroy shots in flight.
export const SHOT_SPEED = 0.45;
export const SHOT_HIT = 0.05;
const FIRING_TYPES = ['flipper', 'tanker'];

// Probability that a firing enemy shoots this frame given a rate in shots/sec.
export function fireChance(rate, dt) {
  if (!(rate > 0) || !(dt > 0)) return 0;
  return 1 - Math.exp(-rate * dt);
}

// Only climbing flippers/tankers fire; not mid-flip, not at the rim, not right at the spawn point.
export function canFire(enemy) {
  return FIRING_TYPES.includes(enemy.type) && !enemy.flip && enemy.z > 0.1 && enemy.z < 0.9;
}

// Returns the new shots fired this frame (does not mutate inputs).
export function fireShots(enemies, rate, dt, rng = Math.random) {
  const p = fireChance(rate, dt);
  if (p <= 0) return [];
  const out = [];
  for (const e of enemies) if (canFire(e) && rng() < p) out.push({ lane: e.lane, z: e.z });
  return out;
}

// Advance shots; returns { shots: still travelling, arrived: shots that reached the rim }.
export function stepShots(shots, dt, speed = SHOT_SPEED) {
  const live = [];
  const arrived = [];
  for (const s of shots) {
    const z = s.z + speed * dt;
    if (z >= 1) arrived.push({ lane: s.lane, z: 1 });
    else live.push({ lane: s.lane, z });
  }
  return { shots: live, arrived };
}

// A shot that reached the rim on the claw's lane kills it.
export function shotHitsClaw(shot, playerLane) {
  return shot.z >= 1 && shot.lane === playerLane;
}

// Player bullet (travelling z 1 -> 0) meets an enemy shot (z 0 -> 1) in the same lane.
export function bulletHitsShot(bullet, shot) {
  return bullet.lane === shot.lane && Math.abs(bullet.z - shot.z) < SHOT_HIT;
}
