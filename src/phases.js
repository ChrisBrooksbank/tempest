// Pure level-transition helpers (no DOM). Phases: 'in' (zoom in), 'run', 'out' (zoom through), 'dead'.
export const IN_TIME = 0.9;
export const OUT_TIME = 0.9;
export const DEAD_TIME = 1.2;

const ease = (t) => t * t * (3 - 2 * t);
const unit = (t, d) => Math.max(0, Math.min(1, t / d));

// Visual zoom/alpha and completion flag for a phase at time t. Always finite.
export function phaseView(phase, t) {
  if (phase === 'in') {
    const e = ease(unit(t, IN_TIME));
    return { zoom: 0.25 + 0.75 * e, alpha: e, done: t >= IN_TIME };
  }
  if (phase === 'out') {
    const e = ease(unit(t, OUT_TIME));
    return { zoom: 1 + e * 3, alpha: 1 - e, done: t >= OUT_TIME };
  }
  if (phase === 'dead') return { zoom: 1, alpha: 1, done: t >= DEAD_TIME };
  return { zoom: 1, alpha: 1, done: false };
}

// Next phase once the current one is done (the game decides what follows 'dead' / 'out').
export function nextPhase(phase) {
  if (phase === 'in') return 'run';
  return phase;
}

// Starting a game from title/game-over needs a fresh key press (not auto-repeat) after a delay.
export function canStart(state, overT, repeat) {
  return !repeat && (state === 'title' || (state === 'over' && overT > 0.8));
}
