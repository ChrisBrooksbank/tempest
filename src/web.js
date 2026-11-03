// Pure web geometry: no DOM, no globals. Every helper takes the web explicitly.

export function build({ closed, sub, corners }) {
  const pts = [],
    edges = closed ? corners.length : corners.length - 1;
  for (let e = 0; e < edges; e++) {
    const a = corners[e],
      b = corners[(e + 1) % corners.length];
    for (let s = 0; s < sub; s++)
      pts.push([a[0] + ((b[0] - a[0]) * s) / sub, a[1] + ((b[1] - a[1]) * s) / sub]);
  }
  if (!closed) pts.push(corners[corners.length - 1]);
  const m = Math.max(...pts.flat().map(Math.abs));
  return {
    closed,
    pts: pts.map((p) => [p[0] / m, p[1] / m]),
    lanes: closed ? pts.length : pts.length - 1,
  };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Move `d` lanes: wraps on closed webs, clamps on open ones.
export const step = (web, lane, d) =>
  web.closed
    ? (((lane + d) % web.lanes) + web.lanes) % web.lanes
    : clamp(lane + d, 0, web.lanes - 1);

// Signed shortest lane distance from a to b.
export function wdiff(web, a, b) {
  if (!web.closed) return b - a;
  const L = web.lanes,
    d = (((b - a) % L) + L) % L;
  return d > L / 2 ? d - L : d;
}

export const dirTo = (web, a, b) => Math.sign(wdiff(web, a, b));

// Lane at the top (max y) of a closed web; centre lane of an open one.
export function startLane(web) {
  if (!web.closed) return web.lanes >> 1;
  let best = 0,
    by = -9;
  for (let i = 0; i < web.lanes; i++) {
    const y = (web.pts[i][1] + web.pts[(i + 1) % web.lanes][1]) / 2;
    if (y > by + 1e-6) {
      by = y;
      best = i;
    }
  }
  return best;
}
