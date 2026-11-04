// Pure input-feel, pause, attract-mode AI and gamepad helpers (no DOM).
import { wdiff } from './web.js';

// Key-repeat interval (s) between lane steps: starts slow, accelerates the longer a key is held.
export const REPEAT_START = 0.12;
export const REPEAT_MIN = 0.05;
export const REPEAT_RAMP = 0.6; // seconds held to reach the minimum
export function repeatInterval(heldT) {
  const k = Math.max(0, Math.min(1, heldT / REPEAT_RAMP));
  return REPEAT_START + (REPEAT_MIN - REPEAT_START) * k;
}

// Pointer glide: seconds per lane step; far targets are chased faster, near ones ease in.
export function glideInterval(dist) {
  const d = Math.abs(dist);
  if (d <= 1) return 0.06;
  return Math.max(0.015, 0.045 - 0.005 * d);
}

// Pause only makes sense mid-game.
export function canPause(state) {
  return state === 'play';
}
export function togglePause(paused, state) {
  return canPause(state) ? !paused : false;
}
// Auto-pause when the tab/window loses focus during play.
export function autoPause(paused, state) {
  return canPause(state) ? true : paused;
}

// Attract-mode AI: chase the most advanced enemy, fire when lined up.
// During the warp dive, head for the nearest spike-free lane instead.
export function attractMove(web, lane, ents, spikes, warping = false) {
  if (warping) {
    let best = lane,
      bd = Infinity;
    for (let i = 0; i < web.lanes; i++) {
      if (spikes[i] > 0) continue;
      const d = Math.abs(wdiff(web, lane, i));
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return { target: best, fire: false };
  }
  let tgt = null;
  for (const e of ents) if (!tgt || e.z > tgt.z) tgt = e;
  if (!tgt) return { target: lane, fire: false };
  const target = Math.round(tgt.lane);
  return { target, fire: Math.abs(wdiff(web, lane, target)) < 1 };
}

// Gamepad mapping (standard layout): stick/d-pad moves, A/B/X/RT fire, Y/RB zap, Start pauses.
export const DEADZONE = 0.35;
const down = (b) => !!b && (b.pressed || b.value > 0.5);
export function padState(pad) {
  const out = { l: false, r: false, fire: false, zap: false, pause: false };
  if (!pad) return out;
  const ax = (pad.axes && pad.axes[0]) || 0,
    b = pad.buttons || [];
  out.l = ax < -DEADZONE || down(b[14]);
  out.r = ax > DEADZONE || down(b[15]);
  if (out.l && out.r) out.l = out.r = false;
  out.fire = down(b[0]) || down(b[1]) || down(b[2]) || down(b[7]);
  out.zap = down(b[3]) || down(b[5]);
  out.pause = down(b[9]);
  return out;
}
// True only on the frame a pad button goes from up to down.
export const risen = (prev, now) => !prev && now;
