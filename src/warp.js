// Pure level-end warp dive: the claw descends the web (z 1 -> 0) and any spike on its lane is lethal.
export const WARP_TIME = 2.2; // seconds to dive from rim to centre
export const DIVE_BONUS = 500;

// Advance the claw depth; clamped to [0, 1].
export function stepWarp(z, dt) {
  return Math.max(0, Math.min(1, z - dt / WARP_TIME));
}

// The claw at depth z hits a spike once it descends to the spike's tip.
export function warpHit(spikes, lane, z) {
  const len = spikes[lane] ?? 0;
  return len > 0 && z <= len;
}

export const warpDone = (z) => z <= 0;

// Bonus for a clean dive (no per-level scaling, like the other point values).
export const diveBonus = () => DIVE_BONUS;
