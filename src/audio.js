// Audio: mute state (persisted, never throws) and a lazily-woken Web Audio sfx().
export const MUTE_KEY = 'tempest.muted';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadMuted(storage = defaultStorage()) {
  try {
    return storage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted, storage = defaultStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(MUTE_KEY, muted ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}

// Each preset is a list of notes: [f0, f1, duration, wave, volume, delay].
export const PRESETS = {
  fire: [[900, 200, 0.07, 'square', 0.04, 0]],
  killFlipper: [[300, 40, 0.25, 'sawtooth', 0.05, 0]],
  killTanker: [
    [180, 30, 0.35, 'square', 0.06, 0],
    [360, 60, 0.2, 'sawtooth', 0.04, 0.05],
  ],
  killSpiker: [[700, 90, 0.3, 'triangle', 0.06, 0]],
  killPulsar: [
    [1200, 200, 0.25, 'sine', 0.06, 0],
    [400, 60, 0.2, 'sawtooth', 0.03, 0.04],
  ],
  death: [
    [520, 40, 0.8, 'sawtooth', 0.07, 0],
    [160, 30, 0.9, 'square', 0.04, 0.1],
  ],
  levelClear: [
    [400, 400, 0.12, 'triangle', 0.06, 0],
    [600, 600, 0.12, 'triangle', 0.06, 0.12],
    [800, 1200, 0.4, 'triangle', 0.06, 0.24],
  ],
  extraLife: [
    [600, 600, 0.1, 'square', 0.05, 0],
    [800, 800, 0.1, 'square', 0.05, 0.1],
    [1200, 1400, 0.3, 'square', 0.05, 0.2],
  ],
  zap: [[120, 1500, 0.5, 'sawtooth', 0.07, 0]],
};

export function killPreset(type) {
  const name = 'kill' + String(type).charAt(0).toUpperCase() + String(type).slice(1);
  return name in PRESETS ? name : 'killFlipper';
}

export function createAudio({
  storage = defaultStorage(),
  AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext,
} = {}) {
  let muted = loadMuted(storage);
  let ac = null;

  function wake() {
    try {
      if (!ac && AudioContextCtor) ac = new AudioContextCtor();
      if (ac && ac.state === 'suspended') ac.resume();
    } catch {
      // audio unavailable: sfx() no-ops while ac is null
    }
  }

  function sfx(f0, f1, d, type = 'square', v = 0.04, delay = 0) {
    if (muted || !ac) return;
    try {
      const t = ac.currentTime + delay,
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
    } catch {
      // never let audio errors reach the game loop
    }
  }

  function play(name) {
    for (const n of PRESETS[name] ?? []) sfx(...n);
  }

  return {
    wake,
    sfx,
    play,
    isMuted: () => muted,
    setMuted(m) {
      muted = !!m;
      saveMuted(muted, storage);
      return muted;
    },
    toggle() {
      return this.setMuted(!muted);
    },
  };
}

// On-screen mute button: bottom-right square, shared by drawing and hit-testing.
export function muteButtonRect(W, H) {
  const size = Math.max(32, Math.min(W, H) * 0.06),
    margin = size * 0.4;
  return { x: W - margin - size, y: H - margin - size, size };
}

export function hitMuteButton(px, py, W, H) {
  const { x, y, size } = muteButtonRect(W, H),
    pad = size * 0.25;
  return px >= x - pad && px <= x + size + pad && py >= y - pad && py <= y + size + pad;
}
