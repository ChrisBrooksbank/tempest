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

  function sfx(f0, f1, d, type = 'square', v = 0.04) {
    if (muted || !ac) return;
    try {
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
    } catch {
      // never let audio errors reach the game loop
    }
  }

  return {
    wake,
    sfx,
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
