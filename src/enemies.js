// Per-type enemy table: { create, update, draw, onKill, score }.
// update/create/onKill are pure (state + helpers passed in); draw gets a render context.
import { step, dirTo } from './web.js';
import { pointsFor } from './scoring.js';

export const FLIP_TIME = 0.28;
const ease = (t) => t * t * (3 - 2 * t);

// Lane position including any in-progress flip.
export function visualLane(e) {
  return e.lane + (e.flip ? e.flip.d * ease(e.flip.t) : 0);
}

const flipper = {
  create({ web, plan, rng = Math.random }) {
    return {
      type: 'flipper',
      lane: Math.floor(rng() * web.lanes),
      z: 0,
      v: plan.speed * (0.8 + rng() * 0.4),
      ft: 0.4 + rng(),
      ct: 0.12,
      flip: null,
    };
  },
  update(e, dt, { web, playerLane, rng = Math.random }) {
    if (e.z < 1) e.z = Math.min(1, e.z + e.v * dt);
    if (e.flip) {
      e.flip.t += dt / FLIP_TIME;
      if (e.flip.t >= 1) {
        e.lane = step(web, e.lane, e.flip.d);
        e.flip = null;
      }
    } else if (e.z < 1) {
      e.ft -= dt;
      if (e.ft <= 0) {
        const d = rng() < 0.5 ? 1 : -1;
        if (step(web, e.lane, d) !== e.lane) e.flip = { d, t: 0 };
        e.ft = 0.5 + rng() * 1.2;
      }
    } else {
      e.ct -= dt;
      if (e.ct <= 0) {
        e.ct = 0.16;
        const d = dirTo(web, e.lane, playerLane);
        if (d) e.flip = { d, t: 0 };
      }
    }
  },
  draw(e, { g, Q, glow, color }) {
    const u = visualLane(e);
    const a = Q(u, e.z),
      b = Q(u + 1, e.z);
    const p = Q(u + 0.5, Math.min(1, e.z + 0.04)),
      q = Q(u + 0.5, Math.max(0, e.z - 0.04));
    const tx = (p[0] - q[0]) / 2,
      ty = (p[1] - q[1]) / 2;
    glow(color, 2);
    g.beginPath();
    g.moveTo(a[0] - tx, a[1] - ty);
    g.lineTo(b[0] + tx, b[1] + ty);
    g.lineTo(b[0] - tx, b[1] - ty);
    g.lineTo(a[0] + tx, a[1] + ty);
    g.closePath();
    g.stroke();
  },
  // Returns extra entities created by the death (none for a flipper).
  onKill() {
    return [];
  },
  score: (level) => pointsFor('flipper', level),
};

// Lanes for the two flippers a tanker releases: both neighbours, or (at an
// open-web edge) the tanker's own lane plus the one neighbour that exists.
export function splitLanes(web, lane) {
  const a = step(web, lane, -1),
    b = step(web, lane, 1);
  if (a === lane) return [lane, b];
  if (b === lane) return [a, lane];
  return [a, b];
}

const tanker = {
  create({ web, plan, rng = Math.random }) {
    return {
      type: 'tanker',
      lane: Math.floor(rng() * web.lanes),
      z: 0,
      v: plan.speed * 0.6 * (0.8 + rng() * 0.4),
      ft: 0.8 + rng(),
      ct: 0.2,
      flip: null,
    };
  },
  update(e, dt, ctx) {
    // Slower, steadier lane-changer; at the rim it still hunts the player.
    flipper.update(e, dt, ctx);
  },
  draw(e, { g, Q, glow }) {
    const u = visualLane(e);
    const a = Q(u, e.z),
      b = Q(u + 1, e.z);
    const c = Q(u + 0.5, Math.min(1, e.z + 0.05)),
      d = Q(u + 0.5, Math.max(0, e.z - 0.05));
    glow('#ffb000', 4);
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.lineTo(b[0], b[1]);
    g.lineTo(d[0], d[1]);
    g.lineTo(a[0], a[1]);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
  },
  onKill(e, { web }) {
    return splitLanes(web, e.lane).map((lane) => ({
      type: 'flipper',
      lane,
      z: e.z,
      v: e.v / 0.6,
      ft: 0.5,
      ct: 0.12,
      flip: null,
    }));
  },
  score: (level) => pointsFor('tanker', level),
};

// -- Spikes -------------------------------------------------------------------
// spikes[lane] = length (0 none .. 1 reaches the rim). Laid by spikers, shortened by shots.
export const SPIKE_DANGER = 0.85; // a spike this long on the player's lane kills
export const SPIKE_SHOT = 0.12; // length removed per bullet hit

export const newSpikes = (web) => new Array(web.lanes).fill(0);

export function growSpike(spikes, lane, z) {
  if (z > spikes[lane]) spikes[lane] = z;
}

// A bullet at depth z hits the spike if it has reached the spike's tip.
// Returns true when the bullet is absorbed (and shortens the spike).
export function shootSpike(spikes, lane, z) {
  const len = spikes[lane];
  if (len <= 0 || z > len) return false;
  spikes[lane] = len - SPIKE_SHOT < 0.02 ? 0 : len - SPIKE_SHOT;
  return true;
}

export const spikeHit = (spikes, playerLane) => spikes[playerLane] >= SPIKE_DANGER;

const spiker = {
  create({ web, plan, rng = Math.random }) {
    return {
      type: 'spiker',
      lane: Math.floor(rng() * web.lanes),
      z: 0,
      v: plan.speed * 0.8 * (0.8 + rng() * 0.4),
      target: 0.5 + rng() * 0.45, // depth it climbs to before retreating
      retreat: false,
      gone: false,
      flip: null,
    };
  },
  update(e, dt, { spikes }) {
    if (!e.retreat) {
      e.z = Math.min(e.target, e.z + e.v * dt);
      if (e.z >= e.target) e.retreat = true;
    } else {
      e.z = Math.max(0, e.z - e.v * 1.5 * dt);
      if (e.z <= 0) e.gone = true;
    }
    if (spikes) growSpike(spikes, e.lane, e.z);
  },
  draw(e, { g, Q, glow }) {
    const u = e.lane,
      cz = e.z,
      mid = Q(u + 0.5, cz);
    glow('#4dff88', 3);
    // coiled zig-zag across the lane
    g.beginPath();
    g.moveTo(mid[0], mid[1]);
    for (let i = 0; i <= 6; i++) {
      const p = Q(u + (i % 2 ? 0.85 : 0.15), Math.max(0, cz - 0.045 * i * 0.7));
      g.lineTo(p[0], p[1]);
    }
    g.stroke();
  },
  onKill() {
    return [];
  },
  score: (level) => pointsFor('spiker', level),
};

// Pulsar: a quick lane-hopper that periodically electrifies its lane. While
// the pulse is on, the player sharing that lane dies regardless of depth.
export const PULSE_PERIOD = 2.2;
export const PULSE_ON = 0.7;

export const isPulsing = (e) => e.type === 'pulsar' && e.pt > PULSE_PERIOD - PULSE_ON;
export const pulseHit = (e, playerLane) => isPulsing(e) && !e.flip && e.lane === playerLane;

const pulsar = {
  create({ web, plan, rng = Math.random }) {
    return {
      type: 'pulsar',
      lane: Math.floor(rng() * web.lanes),
      z: 0,
      v: plan.speed * 0.9 * (0.8 + rng() * 0.4),
      ft: 0.3 + rng() * 0.6,
      ct: 0.14,
      pt: rng() * (PULSE_PERIOD - PULSE_ON),
      flip: null,
    };
  },
  update(e, dt, ctx) {
    flipper.update(e, dt, ctx);
    e.pt += dt;
    if (e.pt >= PULSE_PERIOD) e.pt -= PULSE_PERIOD;
  },
  draw(e, { g, Q, glow }) {
    const u = visualLane(e);
    const on = isPulsing(e);
    const col = on ? '#ffffff' : '#c040ff';
    glow(col, on ? 8 : 3);
    const a = Q(u, e.z),
      b = Q(u + 1, e.z),
      m = Q(u + 0.5, e.z);
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(m[0], m[1] - 6);
    g.lineTo(b[0], b[1]);
    g.lineTo(m[0], m[1] + 6);
    g.closePath();
    g.stroke();
    if (on) {
      // electric arc down the whole lane
      const lo = Q(u + 0.5, 0),
        hi = Q(u + 0.5, 1);
      g.beginPath();
      g.moveTo(lo[0], lo[1]);
      for (let i = 1; i <= 8; i++) {
        const t = i / 8,
          j = i % 2 ? 4 : -4;
        g.lineTo(lo[0] + (hi[0] - lo[0]) * t + j, lo[1] + (hi[1] - lo[1]) * t - j);
      }
      g.stroke();
    }
  },
  onKill() {
    return [];
  },
  score: (level) => pointsFor('pulsar', level),
};

export const ENEMY_TYPES = { flipper, tanker, spiker, pulsar };

export function enemyType(e) {
  return ENEMY_TYPES[e.type || 'flipper'];
}

export function createEnemy(type, ctx) {
  return ENEMY_TYPES[type].create(ctx);
}
