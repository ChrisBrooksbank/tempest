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

// Master boost; the compressor on the bus keeps layered sounds from clipping.
const MASTER_GAIN = 4;

// Each preset is a list of layered notes: [f0, f1, duration, wave, volume, delay].
// wave 'noise' is a band-passed noise burst whose centre frequency sweeps f0 -> f1.
export const PRESETS = {
  fire: [
    [1500, 160, 0.09, 'square', 0.04, 0],
    [750, 80, 0.1, 'sawtooth', 0.03, 0],
    [3000, 600, 0.04, 'noise', 0.05, 0],
  ],
  killFlipper: [
    [2400, 180, 0.3, 'noise', 0.16, 0],
    [420, 45, 0.28, 'sawtooth', 0.06, 0],
    [210, 40, 0.22, 'square', 0.04, 0.02],
  ],
  killTanker: [
    [130, 22, 0.55, 'sine', 0.2, 0],
    [1400, 90, 0.45, 'noise', 0.18, 0],
    [300, 40, 0.35, 'sawtooth', 0.06, 0.04],
    [90, 30, 0.4, 'square', 0.05, 0.08],
  ],
  killSpiker: [
    [1000, 90, 0.35, 'triangle', 0.1, 0],
    [3500, 300, 0.3, 'noise', 0.12, 0],
    [500, 60, 0.3, 'sawtooth', 0.04, 0.03],
  ],
  killPulsar: [
    [1800, 120, 0.3, 'sine', 0.1, 0],
    [3000, 200, 0.35, 'noise', 0.12, 0],
    [700, 70, 0.3, 'sawtooth', 0.05, 0.03],
    [2400, 400, 0.15, 'square', 0.03, 0.06],
  ],
  death: [
    [3200, 80, 1.0, 'noise', 0.2, 0],
    [600, 28, 1.0, 'sawtooth', 0.09, 0],
    [220, 20, 1.1, 'square', 0.07, 0.1],
    [90, 20, 1.2, 'sine', 0.16, 0.05],
  ],
  levelClear: [
    [400, 400, 0.12, 'triangle', 0.08, 0],
    [600, 600, 0.12, 'triangle', 0.08, 0.12],
    [800, 1200, 0.45, 'triangle', 0.08, 0.24],
    [1600, 2400, 0.4, 'sine', 0.04, 0.26],
  ],
  extraLife: [
    [600, 600, 0.1, 'square', 0.05, 0],
    [800, 800, 0.1, 'square', 0.05, 0.1],
    [1200, 1400, 0.35, 'square', 0.05, 0.2],
    [2400, 2800, 0.3, 'sine', 0.04, 0.22],
  ],
  enemyFire: [
    [700, 180, 0.14, 'triangle', 0.05, 0],
    [1800, 400, 0.08, 'noise', 0.04, 0],
  ],
  shotHit: [
    [1000, 250, 0.09, 'square', 0.04, 0],
    [2500, 500, 0.06, 'noise', 0.08, 0],
  ],
  move: [[260, 200, 0.035, 'square', 0.025, 0]],
  spawn: [
    [200, 700, 0.18, 'sawtooth', 0.04, 0],
    [1200, 3000, 0.15, 'noise', 0.04, 0],
  ],
  levelStart: [
    [100, 900, 0.7, 'sawtooth', 0.06, 0],
    [200, 1800, 0.7, 'square', 0.025, 0.05],
    [500, 4000, 0.6, 'noise', 0.07, 0],
  ],
  warp: [
    [150, 1400, 0.9, 'sawtooth', 0.07, 0],
    [300, 3000, 0.9, 'triangle', 0.05, 0],
    [600, 5000, 0.8, 'noise', 0.08, 0.05],
  ],
  spikeHit: [
    [900, 250, 0.08, 'triangle', 0.06, 0],
    [4000, 1200, 0.06, 'noise', 0.07, 0],
  ],
  enemyBurst: [
    [1500, 200, 0.25, 'noise', 0.12, 0],
    [350, 60, 0.2, 'sawtooth', 0.05, 0],
  ],
  gameOver: [
    [440, 330, 0.35, 'sawtooth', 0.08, 0],
    [330, 247, 0.35, 'sawtooth', 0.08, 0.35],
    [247, 165, 0.35, 'sawtooth', 0.08, 0.7],
    [165, 55, 1.0, 'sawtooth', 0.09, 1.05],
    [110, 30, 1.2, 'sine', 0.15, 1.05],
  ],
  zap: [
    [100, 1800, 0.6, 'sawtooth', 0.08, 0],
    [200, 3600, 0.6, 'square', 0.03, 0.02],
    [4000, 800, 0.6, 'noise', 0.1, 0],
  ],
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

  let out = null; // master bus: boost -> compressor -> speakers

  function wake() {
    try {
      if (!ac && AudioContextCtor) {
        ac = new AudioContextCtor();
        out = ac.destination;
        if (ac.createGain && ac.createDynamicsCompressor) {
          const boost = ac.createGain(),
            comp = ac.createDynamicsCompressor();
          boost.gain.value = MASTER_GAIN;
          boost.connect(comp);
          comp.connect(ac.destination);
          out = boost;
        }
      }
      if (ac && ac.state === 'suspended') ac.resume();
    } catch {
      // audio unavailable: sfx() no-ops while ac is null
    }
  }

  let noiseBuf = null;
  function noise(f0, f1, d, v, t) {
    if (!ac.createBuffer || !ac.createBufferSource || !ac.createBiquadFilter) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate), ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ac.createBufferSource(),
      filt = ac.createBiquadFilter(),
      a = ac.createGain();
    src.buffer = noiseBuf;
    filt.type = 'bandpass';
    filt.Q.value = 0.8;
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(f1, t + d);
    a.gain.setValueAtTime(v, t);
    a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src
      .connect(filt)
      .connect(a)
      .connect(out ?? ac.destination);
    src.start(t);
    src.stop(t + d);
  }

  function sfx(f0, f1, d, type = 'square', v = 0.04, delay = 0) {
    if (muted || !ac) return;
    try {
      if (type === 'noise') return noise(f0, f1, d, v, ac.currentTime + delay);
      const t = ac.currentTime + delay,
        o = ac.createOscillator(),
        a = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + d);
      a.gain.setValueAtTime(0.0001, t);
      a.gain.exponentialRampToValueAtTime(v, t + Math.min(0.005, d / 4));
      a.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(a).connect(out ?? ac.destination);
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
