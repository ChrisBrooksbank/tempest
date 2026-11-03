// Pure helpers for particles, screen shake and flash. No DOM access.

export const MAX_PARTICLES = 400;
export const SHAKE_DURATION = 0.5;
export const SHAKE_MAX = 14; // px at the moment of death

// Per-event burst tuning: particle count, speed (px/s).
export const BURSTS = {
  kill: { n: 14, speed: 200 },
  zap: { n: 8, speed: 200 },
  death: { n: 40, speed: 360 },
  spike: { n: 5, speed: 120 },
};

// Burst size for an event; reduced motion trims the particle count.
export function burstSpec(event, reduced = false) {
  const b = BURSTS[event] ?? BURSTS.kill;
  return { n: reduced ? Math.ceil(b.n / 2) : b.n, speed: b.speed };
}

// Append `incoming` to `list` without exceeding `cap`; oldest particles are dropped first.
export function capParticles(list, incoming, cap = MAX_PARTICLES) {
  const all = list.concat(incoming);
  return all.length > cap ? all.slice(all.length - cap) : all;
}

// Shake amplitude (px) `t` seconds after the event; decays linearly to 0.
export function shakeAmplitude(t, reduced = false) {
  if (reduced || t < 0 || t >= SHAKE_DURATION) return 0;
  return SHAKE_MAX * (1 - t / SHAKE_DURATION);
}

// Peak white-flash intensity (0..1).
export function flashPeak(reduced = false) {
  return reduced ? 0.25 : 1;
}
