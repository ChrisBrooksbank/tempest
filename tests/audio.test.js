import { describe, it, expect, vi } from 'vitest';
import { createAudio, loadMuted, saveMuted, MUTE_KEY } from '../src/audio.js';

function memStorage(init = {}) {
  const m = { ...init };
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => {
      m[k] = String(v);
    },
    m,
  };
}
const throwing = {
  getItem() {
    throw new Error('denied');
  },
  setItem() {
    throw new Error('denied');
  },
};

function fakeCtor() {
  const osc = {
    type: '',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
  osc.connect.mockReturnValue({ connect: vi.fn() });
  const Ctor = vi.fn(function () {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
    this.createOscillator = vi.fn(() => osc);
    this.createGain = vi.fn(() => gain);
  });
  return { Ctor, osc };
}

describe('mute persistence', () => {
  it('defaults to unmuted', () => {
    expect(loadMuted(memStorage())).toBe(false);
  });
  it('round-trips', () => {
    const s = memStorage();
    saveMuted(true, s);
    expect(s.m[MUTE_KEY]).toBe('1');
    expect(loadMuted(s)).toBe(true);
  });
  it('survives throwing or missing storage', () => {
    expect(loadMuted(throwing)).toBe(false);
    expect(saveMuted(true, throwing)).toBe(false);
    expect(saveMuted(true, null)).toBe(false);
  });
});

describe('createAudio', () => {
  it('toggle flips and persists', () => {
    const s = memStorage();
    const a = createAudio({ storage: s, AudioContextCtor: null });
    expect(a.toggle()).toBe(true);
    expect(a.isMuted()).toBe(true);
    expect(createAudio({ storage: s, AudioContextCtor: null }).isMuted()).toBe(true);
    expect(a.toggle()).toBe(false);
  });
  it('sfx is a no-op when muted', () => {
    const { Ctor, osc } = fakeCtor();
    const a = createAudio({ storage: memStorage({ [MUTE_KEY]: '1' }), AudioContextCtor: Ctor });
    a.wake();
    a.sfx(100, 200, 0.1);
    expect(osc.start).not.toHaveBeenCalled();
  });
  it('sfx is a no-op before wake, plays after', () => {
    const { Ctor, osc } = fakeCtor();
    const a = createAudio({ storage: memStorage(), AudioContextCtor: Ctor });
    a.sfx(100, 200, 0.1);
    expect(Ctor).not.toHaveBeenCalled();
    a.wake();
    a.sfx(100, 200, 0.1);
    expect(osc.start).toHaveBeenCalledTimes(1);
  });
  it('no errors when AudioContext is unavailable or throws', () => {
    const a = createAudio({ storage: memStorage(), AudioContextCtor: null });
    expect(() => {
      a.wake();
      a.sfx(1, 2, 0.1);
    }).not.toThrow();
    const b = createAudio({
      storage: memStorage(),
      AudioContextCtor: function () {
        throw new Error('nope');
      },
    });
    expect(() => {
      b.wake();
      b.sfx(1, 2, 0.1);
    }).not.toThrow();
  });
});
