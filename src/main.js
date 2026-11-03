import { build, step, wdiff, dirTo, startLane } from './web.js';
import { SHAPES } from './shapes.js';
import { levelConfig } from './levels.js';
import { spawnPlan } from './difficulty.js';
import { bulletHits, clawHit } from './collision.js';
import { pointsFor, levelBonus, extraLivesEarned } from './scoring.js';

// ── Config ──────────────────────────────────────────────────────────────────
const K = 0.12; // depth: scale of the far rim relative to the near rim
const CLAW = '#ffe14a',
  FOE = '#ff4d6d';
const cv = document.getElementById('c'),
  g = cv.getContext('2d');
let W, H, cx, cy, R;
function resize() {
  const d = devicePixelRatio || 1;
  W = innerWidth;
  H = innerHeight;
  cv.width = W * d;
  cv.height = H * d;
  g.setTransform(d, 0, 0, d, 0, 0);
  cx = W / 2;
  cy = H / 2;
  R = Math.min(W * 0.44, H * 0.4);
}
addEventListener('resize', resize);
resize();

let web,
  color,
  zoom = 1,
  alpha = 1;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t * t * (3 - 2 * t);

// Point on the web: u = fractional vertex index, z = depth (0 far … 1 rim)
function Q(u, z) {
  const { pts, closed } = web,
    n = pts.length,
    i = Math.floor(u),
    f = u - i;
  const idx = (j) => (closed ? ((j % n) + n) % n : clamp(j, 0, n - 1));
  const a = pts[idx(i)],
    b = pts[idx(i + 1)],
    s = R * zoom * Math.pow(K, 1 - z);
  return [cx + (a[0] + (b[0] - a[0]) * f) * s, cy + (a[1] + (b[1] - a[1]) * f) * s];
}
// ── State ───────────────────────────────────────────────────────────────────
let state = 'title',
  phase = 'run',
  phaseT = 0,
  level = 1,
  score = 0,
  lives = 3,
  overT = 0;
let ents = [],
  bullets = [],
  sparks = [],
  spawnLeft = 0,
  spawnT = 0,
  cooldown = 0,
  moveT = 0,
  stepT = 0;
const player = { lane: 0, target: 0, pu: 0 };
const held = { l: false, r: false, fire: false };

function setState(s) {
  state = s;
  cv.dataset.state = s;
}
function setScore(v) {
  const gained = extraLivesEarned(score, v);
  if (gained > 0) {
    lives += gained;
    sfx(600, 1400, 0.4, 'square', 0.05);
  }
  score = v;
  cv.dataset.score = v;
}

function startLevel(n) {
  const cfg = levelConfig(n);
  level = n;
  web = build(SHAPES[cfg.shapeIndex]);
  color = cfg.color;
  ents = [];
  bullets = [];
  spawnLeft = spawnPlan(n).count;
  spawnT = 1;
  player.lane = player.target = player.pu = startLane(web);
  phase = 'in';
  phaseT = 0;
}
function begin() {
  setScore(0);
  lives = 3;
  sparks = [];
  setState('play');
  startLevel(1);
}

// ── Audio ───────────────────────────────────────────────────────────────────
let ac;
function wake() {
  try {
    ac = ac || new AudioContext();
    if (ac.state === 'suspended') ac.resume();
  } catch {
    // audio unavailable: sfx() no-ops while ac is null
  }
}
function sfx(f0, f1, d, type = 'square', v = 0.04) {
  if (!ac) return;
  const t = ac.currentTime,
    o = ac.createOscillator(),
    a = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + d);
  a.gain.setValueAtTime(v, t);
  a.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(a).connect(ac.destination);
  o.start(t);
  o.stop(t + d);
}

// ── Input ───────────────────────────────────────────────────────────────────
const KEYS = {
  ArrowLeft: 'l',
  KeyA: 'l',
  ArrowRight: 'r',
  KeyD: 'r',
  Space: 'fire',
  ArrowUp: 'fire',
  ArrowDown: 'fire',
  KeyW: 'fire',
  KeyS: 'fire',
  Enter: 'fire',
};
function press() {
  wake();
  if (state === 'title' || (state === 'over' && overT > 0.8)) begin();
}
addEventListener('keydown', (e) => {
  const k = KEYS[e.code];
  if (!k || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  held[k] = true;
  press();
});
addEventListener('keyup', (e) => {
  const k = KEYS[e.code];
  if (k) held[k] = false;
});
addEventListener('blur', () => {
  held.l = held.r = held.fire = false;
});

function aim(e) {
  if (!web) return;
  let best = player.target,
    bd = Infinity;
  for (let i = 0; i < web.lanes; i++) {
    const [x, y] = Q(i + 0.5, 1),
      d = (x - e.clientX) ** 2 + (y - e.clientY) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  player.target = best;
}
cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  held.fire = true;
  aim(e);
  press();
});
cv.addEventListener('pointermove', aim);
cv.addEventListener('pointerup', () => {
  held.fire = false;
});
cv.addEventListener('pointercancel', () => {
  held.fire = false;
});

// ── Simulation ──────────────────────────────────────────────────────────────
function burst(x, y, col, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = speed * (0.3 + Math.random() * 0.7);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, col });
  }
}
function spawn() {
  ents.push({
    lane: Math.floor(Math.random() * web.lanes),
    z: 0,
    v: spawnPlan(level).speed * (0.8 + Math.random() * 0.4),
    ft: 0.4 + Math.random(),
    ct: 0.12,
    flip: null,
  });
}
function kill() {
  const [x, y] = Q(player.pu + 0.5, 1);
  burst(x, y, CLAW, 40, 360);
  sfx(520, 40, 0.8, 'sawtooth', 0.07);
  lives--;
  phase = 'dead';
  phaseT = 0;
}

function update(dt) {
  phaseT += dt;
  for (const s of sparks) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.l -= dt * 1.4;
  }
  sparks = sparks.filter((s) => s.l > 0);
  if (state === 'over') overT += dt;

  // keyboard walk + pointer target → lane
  if (phase === 'run' || phase === 'in') {
    if (held.l !== held.r) {
      moveT -= dt;
      if (moveT <= 0) {
        player.target = step(web, player.lane, held.r ? 1 : -1);
        moveT = 0.085;
      }
    } else moveT = 0;
    stepT -= dt;
    if (stepT <= 0 && player.lane !== player.target) {
      player.lane = step(web, player.lane, dirTo(web, player.lane, player.target));
      stepT = 0.035;
    }
    player.pu += wdiff(web, player.pu, player.lane) * Math.min(1, dt * 30);
  }

  if (phase === 'in') {
    const e = ease(Math.min(1, phaseT / 0.9));
    zoom = 0.25 + 0.75 * e;
    alpha = e;
    if (phaseT >= 0.9) {
      phase = 'run';
      zoom = alpha = 1;
    }
    return;
  }
  if (phase === 'out') {
    const e = ease(Math.min(1, phaseT / 0.9));
    zoom = 1 + e * 3;
    alpha = 1 - e;
    if (phaseT >= 0.9) startLevel(level + 1);
    return;
  }
  if (phase === 'dead') {
    if (phaseT >= 1.2) {
      if (lives > 0) {
        spawnLeft += ents.length;
        ents = [];
        bullets = [];
        spawnT = 1.2;
        phase = 'run';
      } else {
        ents = [];
        bullets = [];
        overT = 0;
        setState('over');
        phase = 'run';
      }
    }
    return;
  }
  if (state !== 'play') return;

  // fire
  cooldown -= dt;
  if (held.fire && cooldown <= 0 && bullets.length < 6) {
    bullets.push({ lane: player.lane, z: 0.97 });
    cooldown = 0.11;
    sfx(900, 200, 0.07);
  }
  for (const b of bullets) b.z -= 2.2 * dt;
  bullets = bullets.filter((b) => b.z > 0);

  // spawn
  if (spawnLeft > 0 && ents.length < spawnPlan(level).maxAlive) {
    spawnT -= dt;
    if (spawnT <= 0) {
      spawn();
      spawnLeft--;
      spawnT = spawnPlan(level).interval;
    }
  }

  // enemies
  for (const e of ents) {
    if (e.z < 1) e.z = Math.min(1, e.z + e.v * dt);
    if (e.flip) {
      e.flip.t += dt / 0.28;
      if (e.flip.t >= 1) {
        e.lane = step(web, e.lane, e.flip.d);
        e.flip = null;
      }
    } else if (e.z < 1) {
      e.ft -= dt;
      if (e.ft <= 0) {
        const d = Math.random() < 0.5 ? 1 : -1;
        if (step(web, e.lane, d) !== e.lane) e.flip = { d, t: 0 };
        e.ft = 0.5 + Math.random() * 1.2;
      }
    } else {
      e.ct -= dt;
      if (e.ct <= 0) {
        e.ct = 0.16;
        const d = dirTo(web, e.lane, player.lane);
        if (d) e.flip = { d, t: 0 };
      }
    }
  }

  // shots vs enemies
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    const hit = ents.find((e) => bulletHits(web, e, b));
    if (!hit) continue;
    const [x, y] = Q(hit.lane + (hit.flip ? hit.flip.d * ease(hit.flip.t) : 0) + 0.5, hit.z);
    burst(x, y, FOE, 14, 200);
    sfx(300, 40, 0.25, 'sawtooth', 0.05);
    setScore(score + pointsFor(hit.type || 'flipper', level));
    ents.splice(ents.indexOf(hit), 1);
    bullets.splice(bi, 1);
  }

  // enemies vs claw
  if (ents.some((e) => clawHit(e, player.lane))) {
    kill();
    return;
  }

  // clear
  if (spawnLeft === 0 && ents.length === 0) {
    phase = 'out';
    phaseT = 0;
    setScore(score + levelBonus(level));
    sfx(200, 1200, 0.7, 'triangle', 0.06);
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────
function glow(col, w) {
  g.strokeStyle = col;
  g.shadowColor = col;
  g.lineWidth = w;
  g.shadowBlur = 10;
}

function drawWeb() {
  const n = web.pts.length;
  glow(color, 1.6);
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = Q(i, 0),
      b = Q(i, 1);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  for (const z of [0, 1]) {
    for (let i = 0; i < n; i++) {
      const p = Q(i, z);
      i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
    }
    if (web.closed) g.closePath();
  }
  g.stroke();
  if (state !== 'title' && (phase === 'run' || phase === 'in')) {
    glow(CLAW, 2.4);
    g.beginPath();
    const a = Q(player.pu, 0),
      b = Q(player.pu + 1, 0),
      c = Q(player.pu, 1),
      d = Q(player.pu + 1, 1);
    g.moveTo(a[0], a[1]);
    g.lineTo(c[0], c[1]);
    g.lineTo(d[0], d[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
  }
}

const CLAW_SHAPE = [
  [0, 0],
  [-0.05, 0.9],
  [0.3, 0.3],
  [0.5, 0.6],
  [0.7, 0.3],
  [1.05, 0.9],
  [1, 0],
];
function claw(ax, ay, bx, by, nx, ny, h) {
  g.beginPath();
  CLAW_SHAPE.forEach(([s, o], i) => {
    const x = ax + (bx - ax) * s + nx * o * h,
      y = ay + (by - ay) * s + ny * o * h;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  });
  g.stroke();
}

function drawPlayer() {
  const a = Q(player.pu, 1),
    b = Q(player.pu + 1, 1),
    m = Q(player.pu + 0.5, 1);
  let nx = m[0] - cx,
    ny = m[1] - cy;
  const l = Math.hypot(nx, ny) || 1;
  glow(CLAW, 2.4);
  claw(
    a[0],
    a[1],
    b[0],
    b[1],
    nx / l,
    ny / l,
    Math.max(14, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.9),
  );
}

function drawEnemy(e) {
  const u = e.lane + (e.flip ? e.flip.d * ease(e.flip.t) : 0);
  const a = Q(u, e.z),
    b = Q(u + 1, e.z);
  const p = Q(u + 0.5, Math.min(1, e.z + 0.04)),
    q = Q(u + 0.5, Math.max(0, e.z - 0.04));
  const tx = (p[0] - q[0]) / 2,
    ty = (p[1] - q[1]) / 2;
  glow(FOE, 2);
  g.beginPath();
  g.moveTo(a[0] - tx, a[1] - ty);
  g.lineTo(b[0] + tx, b[1] + ty);
  g.lineTo(b[0] - tx, b[1] - ty);
  g.lineTo(a[0] + tx, a[1] + ty);
  g.closePath();
  g.stroke();
}

function text(str, x, y, size, col) {
  g.font = `700 ${size}px ui-monospace, Consolas, monospace`;
  g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${size * 0.12}px`;
  glow(col, 1.4);
  g.textAlign = x === 20 ? 'left' : 'center';
  g.strokeText(str, x, y);
}

function draw() {
  g.globalAlpha = 1;
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(0, 0, W, H);
  g.lineJoin = g.lineCap = 'round';

  g.globalAlpha = alpha;
  drawWeb();
  g.globalAlpha = 1;

  if (phase === 'run' || phase === 'dead') {
    glow('#fff', 2.2);
    for (const b of bullets) {
      const p = Q(b.lane + 0.5, b.z),
        q = Q(b.lane + 0.5, Math.min(1, b.z + 0.035));
      g.beginPath();
      g.moveTo(p[0], p[1]);
      g.lineTo(q[0], q[1]);
      g.stroke();
    }
    for (const e of ents) drawEnemy(e);
    if (phase === 'run') drawPlayer();
  }

  for (const s of sparks) {
    g.globalAlpha = Math.max(0, s.l);
    glow(s.col, 1.6);
    g.beginPath();
    g.moveTo(s.x, s.y);
    g.lineTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05);
    g.stroke();
  }
  g.globalAlpha = 1;

  const u = Math.min(W, H);
  if (state === 'title') text('TEMPEST', cx, cy, u * 0.09, color);
  else if (state === 'over') text(String(score), cx, cy, u * 0.12, color);
  else {
    text(String(score), 20, 28, 22, color);
    glow(CLAW, 1.6);
    for (let i = 0; i < lives; i++) {
      const x = W - 28 - i * 28;
      claw(x - 9, 30, x + 9, 30, 0, -1, 12);
    }
  }
}

// ── Loop ────────────────────────────────────────────────────────────────────
startLevel(1);
phase = 'run';
zoom = alpha = 1;
setState('title');
setScore(0);
let last = 0;
(function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(frame);
})(0);
