import { build, step, wdiff, dirTo, startLane } from './web.js';
import { SHAPES } from './shapes.js';
import { levelConfig } from './levels.js';
import { spawnPlan, pickType } from './difficulty.js';
import { fireShots, stepShots, shotHitsClaw, bulletHitsShot } from './shots.js';
import { bulletHits, clawHit } from './collision.js';
import { canZap, superzap, ZAPS_PER_LEVEL } from './superzapper.js';
import { phaseView, nextPhase, canStart } from './phases.js';
import { extraLivesEarned } from './scoring.js';
import { stepWarp, warpHit, warpDone, diveBonus } from './warp.js';
import { load as loadScores, save as saveScores, qualifies, insertScore } from './highscores.js';
import {
  createEntry,
  moveCursor,
  setCursor,
  cycleLetter,
  typeLetter,
  backspace,
  initialsOf,
  SLOTS,
} from './initials.js';
import { burstSpec, capParticles, shakeAmplitude, flashPeak } from './effects.js';
import { bestScore, tableLines } from './hud.js';
import { createAudio, killPreset, muteButtonRect, hitMuteButton } from './audio.js';
import {
  ENEMY_TYPES,
  createEnemy,
  enemyType,
  visualLane,
  newSpikes,
  shootSpike,
  pulseHit,
} from './enemies.js';

// ── Config ──────────────────────────────────────────────────────────────────
const K = 0.12; // depth: scale of the far rim relative to the near rim
const CLAW = '#ffe14a',
  FOE = '#ff4d6d';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
  overT = 0,
  zaps = ZAPS_PER_LEVEL,
  warpZ = 1,
  warpDied = false,
  flash = 0,
  shakeT = Infinity;
const MAX_BULLETS = 8;
let entry = createEntry(),
  scores = loadScores(),
  spikes = [],
  ents = [],
  bullets = [],
  shots = [],
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
    play('extraLife');
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
  shots = [];
  spikes = newSpikes(web);
  spawnLeft = spawnPlan(n).count;
  spawnT = 1;
  zaps = ZAPS_PER_LEVEL;
  flash = 0;
  player.lane = player.target = player.pu = startLane(web);
  phase = 'in';
  zoom = 0.25;
  alpha = 0;
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
const audio = createAudio();
const { wake, play } = audio;

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
  KeyZ: 'zap',
  KeyX: 'zap',
};
function confirmEntry() {
  scores = insertScore(scores, { initials: initialsOf(entry), score });
  saveScores(scores);
  overT = 0;
  setState('over');
}
// Entry layout shared by drawing and pointer hit-testing.
function entryLayout() {
  const u = Math.min(W, H);
  return { u, gap: u * 0.12, y: cy, okY: cy + u * 0.25 };
}
function entryKey(e) {
  if (e.code === 'ArrowUp') entry = cycleLetter(entry, 1);
  else if (e.code === 'ArrowDown') entry = cycleLetter(entry, -1);
  else if (e.code === 'ArrowLeft') entry = moveCursor(entry, -1);
  else if (e.code === 'ArrowRight') entry = moveCursor(entry, 1);
  else if (e.code === 'Backspace') entry = backspace(entry);
  else if (e.code === 'Enter') {
    if (!e.repeat) confirmEntry();
  } else if (/^Key[A-Z]$/.test(e.code)) entry = typeLetter(entry, e.code.slice(3));
  else return false;
  return true;
}
function entryPointer(e) {
  const { u, gap, y, okY } = entryLayout();
  const dy = e.clientY - y;
  if (dy > u * 0.14) {
    if (e.clientY > okY - u * 0.06) confirmEntry();
    return;
  }
  const slot = Math.round((e.clientX - cx) / gap) + Math.floor(SLOTS / 2);
  if (slot < 0 || slot >= SLOTS) return;
  entry = setCursor(entry, slot);
  entry = cycleLetter(entry, dy < 0 ? 1 : -1);
}
function press(repeat = false) {
  wake();
  if (canStart(state, overT, repeat)) begin();
}
addEventListener('keydown', (e) => {
  if (state === 'entry') {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && entryKey(e)) e.preventDefault();
    return;
  }
  if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    if (!e.repeat) {
      wake();
      audio.toggle();
    }
    return;
  }
  const k = KEYS[e.code];
  if (!k || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  if (k === 'zap') {
    if (!e.repeat) {
      wake();
      zap();
    }
    return;
  }
  held[k] = true;
  press(e.repeat);
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
  if (state === 'entry') {
    entryPointer(e);
    return;
  }
  if (hitMuteButton(e.clientX, e.clientY, W, H)) {
    wake();
    audio.toggle();
    return;
  }
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
cv.addEventListener('lostpointercapture', () => {
  held.fire = false;
});
document.addEventListener('visibilitychange', () => {
  held.l = held.r = held.fire = false;
});

// ── Simulation ──────────────────────────────────────────────────────────────
function burst(x, y, col, event) {
  const { n, speed } = burstSpec(event, reducedMotion.matches);
  const made = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = speed * (0.3 + Math.random() * 0.7);
    made.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, col });
  }
  sparks = capParticles(sparks, made);
}
function spawn() {
  const plan = spawnPlan(level);
  const mix = {};
  for (const t of Object.keys(plan.mix)) if (ENEMY_TYPES[t]) mix[t] = plan.mix[t];
  ents.push(createEnemy(pickType(mix), { web, plan }));
}
function zap() {
  if (state !== 'play' || phase !== 'run' || !canZap(zaps, ents)) return;
  const r = superzap(ents, level, zaps);
  zaps--;
  flash = flashPeak(reducedMotion.matches);
  play('zap');
  for (const e of r.victims) {
    const [x, y] = Q(visualLane(e) + 0.5, e.z);
    burst(x, y, FOE, 'zap');
  }
  setScore(score + r.points);
  ents = r.survivors;
}
function kill(z = 1) {
  warpDied = phase === 'warp';
  const [x, y] = Q(player.pu + 0.5, z);
  burst(x, y, CLAW, 'death');
  shakeT = 0;
  play('death');
  lives--;
  phase = 'dead';
  phaseT = 0;
}

function update(dt) {
  phaseT += dt;
  flash = Math.max(0, flash - dt * 3);
  shakeT += dt;
  for (const s of sparks) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.l -= dt * 1.4;
  }
  sparks = sparks.filter((s) => s.l > 0);
  if (state === 'over') overT += dt;

  // keyboard walk + pointer target → lane
  if (phase === 'run' || phase === 'in' || phase === 'warp') {
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

  if (phase === 'in' || phase === 'out') {
    const v = phaseView(phase, phaseT);
    zoom = v.zoom;
    alpha = v.alpha;
    if (v.done) {
      if (phase === 'out') startLevel(level + 1);
      else {
        phase = nextPhase(phase);
        zoom = alpha = 1;
      }
    }
    return;
  }
  if (phase === 'warp') {
    warpZ = stepWarp(warpZ, dt);
    if (warpHit(spikes, player.lane, warpZ)) {
      kill(warpZ);
      return;
    }
    if (warpDone(warpZ)) {
      setScore(score + diveBonus(level));
      phase = 'out';
      phaseT = 0;
    }
    return;
  }
  if (phase === 'dead') {
    if (phaseView('dead', phaseT).done) {
      if (lives > 0 && warpDied) {
        // replay the level clear: dive again from the rim
        warpDied = false;
        warpZ = 1;
        phase = 'warp';
      } else if (lives > 0) {
        spawnLeft += ents.length;
        ents = [];
        bullets = [];
        shots = [];
        spawnT = 1.2;
        phase = 'run';
      } else {
        ents = [];
        bullets = [];
        shots = [];
        overT = 0;
        scores = loadScores();
        held.l = held.r = held.fire = false;
        if (qualifies(scores, score)) {
          entry = createEntry();
          setState('entry');
        } else setState('over');
        phase = 'run';
      }
    }
    return;
  }
  if (state !== 'play') return;

  // fire
  cooldown -= dt;
  if (held.fire && cooldown <= 0 && bullets.length < MAX_BULLETS) {
    bullets.push({ lane: player.lane, z: 0.97 });
    cooldown = 0.11;
    play('fire');
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
  for (const e of ents) enemyType(e).update(e, dt, { web, playerLane: player.lane, spikes });
  for (const e of ents) {
    if (!e.burst) continue;
    const [x, y] = Q(e.lane + 0.5, e.z);
    burst(x, y, FOE, 'kill');
    ents.push(...enemyType(e).onKill(e, { web }));
  }
  ents = ents.filter((e) => !e.gone);

  // enemy shots: fire, travel, and get shot down by player bullets
  const fired = fireShots(ents, spawnPlan(level).enemyFire, dt);
  if (fired.length) play('enemyFire');
  shots.push(...fired);
  const stepped = stepShots(shots, dt);
  shots = stepped.shots;
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const si = shots.findIndex((s) => bulletHitsShot(bullets[bi], s));
    if (si < 0) continue;
    const [x, y] = Q(shots[si].lane + 0.5, shots[si].z);
    burst(x, y, FOE, 'spike');
    play('shotHit');
    shots.splice(si, 1);
    bullets.splice(bi, 1);
  }

  // shots vs spikes
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (shootSpike(spikes, b.lane, b.z)) {
      const [x, y] = Q(b.lane + 0.5, b.z);
      burst(x, y, '#4dff88', 'spike');
      bullets.splice(bi, 1);
    }
  }

  // shots vs enemies
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    const hit = ents.find((e) => bulletHits(web, e, b));
    if (!hit) continue;
    const [x, y] = Q(visualLane(hit) + 0.5, hit.z);
    burst(x, y, FOE, 'kill');
    const kind = enemyType(hit);
    play(killPreset(hit.type));
    setScore(score + kind.score(level, hit));
    ents.splice(ents.indexOf(hit), 1);
    ents.push(...kind.onKill(hit, { web }));
    bullets.splice(bi, 1);
  }

  // enemies vs claw
  if (
    ents.some((e) => clawHit(e, player.lane) || pulseHit(e, player.lane)) ||
    stepped.arrived.some((s) => shotHitsClaw(s, player.lane))
  ) {
    kill();
    return;
  }

  // clear
  if (spawnLeft === 0 && ents.length === 0) {
    phase = 'warp';
    phaseT = 0;
    warpZ = 1;
    bullets = [];
    shots = [];
    play('levelClear');
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
  if (state !== 'title' && (phase === 'run' || phase === 'in' || phase === 'warp')) {
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

function drawPlayer(z) {
  const a = Q(player.pu, z),
    b = Q(player.pu + 1, z),
    m = Q(player.pu + 0.5, z);
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
  enemyType(e).draw(e, { g, Q, glow, color: FOE });
}

function text(str, x, y, size, col, align) {
  g.font = `700 ${size}px ui-monospace, Consolas, monospace`;
  g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${size * 0.12}px`;
  glow(col, 1.4);
  g.textAlign = align || (x === 20 ? 'left' : 'center');
  g.strokeText(str, x, y);
}

function draw() {
  const d = devicePixelRatio || 1;
  g.setTransform(d, 0, 0, d, 0, 0);
  g.globalAlpha = 1;
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.fillRect(0, 0, W, H);
  const amp = shakeAmplitude(shakeT, reducedMotion.matches);
  if (amp > 0) g.translate((Math.random() - 0.5) * 2 * amp, (Math.random() - 0.5) * 2 * amp);
  g.lineJoin = g.lineCap = 'round';

  g.globalAlpha = alpha;
  drawWeb();
  g.globalAlpha = 1;

  if (phase === 'run' || phase === 'dead' || phase === 'out' || phase === 'warp') {
    g.globalAlpha = alpha;
    glow('#fff', 2.2);
    for (const b of bullets) {
      const p = Q(b.lane + 0.5, b.z),
        q = Q(b.lane + 0.5, Math.min(1, b.z + 0.035));
      g.beginPath();
      g.moveTo(p[0], p[1]);
      g.lineTo(q[0], q[1]);
      g.stroke();
    }
    glow(FOE, 2);
    for (const s of shots) {
      const p = Q(s.lane + 0.5, s.z);
      g.beginPath();
      g.arc(p[0], p[1], 3 + 4 * s.z, 0, Math.PI * 2);
      g.stroke();
    }
    glow('#4dff88', 1.6);
    g.beginPath();
    spikes.forEach((len, i) => {
      if (len <= 0) return;
      const a = Q(i + 0.5, 0),
        b = Q(i + 0.5, len);
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0], b[1]);
    });
    g.stroke();
    for (const e of ents) drawEnemy(e);
    if (phase === 'run') drawPlayer(1);
    else if (phase === 'warp') drawPlayer(warpZ);
    g.globalAlpha = 1;
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
  if (flash > 0) {
    g.fillStyle = `rgba(255,255,255,${flash * 0.6})`;
    g.fillRect(0, 0, W, H);
  }

  const u = Math.min(W, H);
  if (state === 'title') {
    text('TEMPEST', cx, cy - u * 0.12, u * 0.09, color);
    const sz = Math.max(11, u * 0.032);
    text('HIGH SCORES', cx, cy - u * 0.04, sz, CLAW);
    const rows = tableLines(scores);
    if (!rows.length) text('NO SCORES YET', cx, cy + u * 0.01, sz, color);
    rows.forEach((r, i) => text(r, cx, cy + u * 0.01 + i * sz * 1.3, sz, color));
  } else if (state === 'entry') {
    const { u: eu, gap, y, okY } = entryLayout();
    const big = eu * 0.1;
    text('NEW HIGH SCORE', cx, y - eu * 0.3, Math.max(14, eu * 0.05), CLAW);
    text(String(score), cx, y - eu * 0.2, Math.max(12, eu * 0.04), color);
    for (let i = 0; i < SLOTS; i++) {
      const x = cx + (i - Math.floor(SLOTS / 2)) * gap;
      const on = i === entry.pos;
      text(entry.letters[i], x, y, big, on ? CLAW : color);
      text('▲', x, y - eu * 0.1, big * 0.3, on ? CLAW : color);
      text('▼', x, y + eu * 0.1, big * 0.3, on ? CLAW : color);
    }
    text('OK', cx, okY, Math.max(14, eu * 0.05), FOE);
  } else if (state === 'over') text(String(score), cx, cy, u * 0.12, color);
  else {
    text(String(score), 20, 28, 22, color);
    text(`HI ${bestScore(scores, score)}`, 20, 54, 13, FOE);
    text(`LEVEL ${level}`, cx, 54, 13, color);
    if (zaps > 0) text(zaps > 1 ? 'ZAP ZAP' : 'ZAP', cx, 28, 16, CLAW);
    glow(CLAW, 1.6);
    for (let i = 0; i < lives; i++) {
      const x = W - 28 - i * 28;
      claw(x - 9, 30, x + 9, 30, 0, -1, 12);
    }
  }
  if (state !== 'entry') drawMuteButton();
}

function drawMuteButton() {
  const { x, y, size } = muteButtonRect(W, H),
    m = audio.isMuted();
  g.globalAlpha = 0.8;
  glow(m ? FOE : color, 1.4);
  g.strokeRect(x, y, size, size);
  g.beginPath();
  g.moveTo(x + size * 0.2, y + size * 0.4);
  g.lineTo(x + size * 0.35, y + size * 0.4);
  g.lineTo(x + size * 0.55, y + size * 0.22);
  g.lineTo(x + size * 0.55, y + size * 0.78);
  g.lineTo(x + size * 0.35, y + size * 0.6);
  g.lineTo(x + size * 0.2, y + size * 0.6);
  g.closePath();
  if (m) {
    g.moveTo(x + size * 0.68, y + size * 0.38);
    g.lineTo(x + size * 0.88, y + size * 0.62);
    g.moveTo(x + size * 0.88, y + size * 0.38);
    g.lineTo(x + size * 0.68, y + size * 0.62);
  } else {
    g.moveTo(x + size * 0.7, y + size * 0.38);
    g.lineTo(x + size * 0.78, y + size * 0.5);
    g.lineTo(x + size * 0.7, y + size * 0.62);
  }
  g.stroke();
  g.globalAlpha = 1;
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
