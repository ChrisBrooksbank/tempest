import { describe, it, expect } from 'vitest';
import { phaseView, nextPhase, canStart, IN_TIME, OUT_TIME, DEAD_TIME } from '../src/phases.js';

describe('phaseView', () => {
  it('zooms in from small/transparent to full', () => {
    const a = phaseView('in', 0);
    expect(a).toMatchObject({ zoom: 0.25, alpha: 0, done: false });
    expect(phaseView('in', IN_TIME)).toMatchObject({ zoom: 1, alpha: 1, done: true });
  });
  it('zooms through and fades out', () => {
    expect(phaseView('out', 0)).toMatchObject({ zoom: 1, alpha: 1, done: false });
    expect(phaseView('out', OUT_TIME)).toMatchObject({ zoom: 4, alpha: 0, done: true });
  });
  it('is monotonic during out', () => {
    let pz = 0;
    for (let t = 0; t <= OUT_TIME; t += 0.05) {
      const v = phaseView('out', t);
      expect(v.zoom).toBeGreaterThanOrEqual(pz);
      pz = v.zoom;
    }
  });
  it('clamps out-of-range times and stays finite', () => {
    for (const t of [-1, 0, 100]) {
      const v = phaseView('out', t);
      expect(Number.isFinite(v.zoom) && Number.isFinite(v.alpha)).toBe(true);
    }
  });
  it('dead finishes after DEAD_TIME; run never finishes', () => {
    expect(phaseView('dead', DEAD_TIME - 0.01).done).toBe(false);
    expect(phaseView('dead', DEAD_TIME).done).toBe(true);
    expect(phaseView('run', 99).done).toBe(false);
  });
});

describe('nextPhase / canStart', () => {
  it('in -> run, others unchanged', () => {
    expect(nextPhase('in')).toBe('run');
    expect(nextPhase('out')).toBe('out');
  });
  it('starts from title on fresh press only', () => {
    expect(canStart('title', 0, false)).toBe(true);
    expect(canStart('title', 0, true)).toBe(false);
  });
  it('game over needs delay and no repeat; play never starts', () => {
    expect(canStart('over', 0.5, false)).toBe(false);
    expect(canStart('over', 1, false)).toBe(true);
    expect(canStart('over', 1, true)).toBe(false);
    expect(canStart('play', 5, false)).toBe(false);
  });
});
