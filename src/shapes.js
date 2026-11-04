// Web shape definitions and per-level colour palette.
export const COLORS = ['#3b6bff', '#18d6e0', '#3dff7a', '#b266ff', '#ff9a2e', '#8aff3d'];

const ring = (n, f) => Array.from({ length: n }, (_, i) => f((i * Math.PI * 2) / n));
// n+1 points sampled for t in [0, 1]: an open web with n lanes.
const arc = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));

export const SHAPES = [
  {
    closed: true,
    sub: 1,
    corners: Array.from({ length: 16 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 16;
      return [Math.cos(a), Math.sin(a)];
    }),
  },
  {
    closed: true,
    sub: 4,
    corners: [
      [-1, 1],
      [-1, -1],
      [1, -1],
      [1, 1],
    ],
  },
  {
    closed: true,
    sub: 1,
    corners: [
      [-0.5, 1.5],
      [-0.5, 0.5],
      [-1.5, 0.5],
      [-1.5, -0.5],
      [-0.5, -0.5],
      [-0.5, -1.5],
      [0.5, -1.5],
      [0.5, -0.5],
      [1.5, -0.5],
      [1.5, 0.5],
      [0.5, 0.5],
      [0.5, 1.5],
    ],
  },
  {
    closed: false,
    sub: 16,
    corners: [
      [-1, 0.85],
      [1, 0.85],
    ],
  },
  {
    closed: false,
    sub: 8,
    corners: [
      [-1, -0.55],
      [0, 0.85],
      [1, -0.55],
    ],
  },
  {
    // 8-point star: alternating outer/inner radii (16 lanes).
    closed: true,
    sub: 1,
    corners: Array.from({ length: 16 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 8,
        r = i % 2 ? 0.45 : 1;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  },
  {
    // Heart: classic parametric curve, centred vertically.
    closed: true,
    sub: 1,
    corners: ring(16, (t) => [
      16 * Math.sin(t) ** 3,
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 6,
    ]),
  },
  {
    // Figure-eight: two lobes pinched at a waist (never self-touching).
    closed: true,
    sub: 1,
    corners: ring(16, (t) => [Math.cos(t), 0.6 * Math.sin(t) * (0.35 + 0.65 * Math.cos(t) ** 2)]),
  },
  {
    // Steps: open staircase rising left to right.
    closed: false,
    sub: 2,
    corners: [
      [-1, -0.6],
      [-0.5, -0.6],
      [-0.5, -0.2],
      [0, -0.2],
      [0, 0.2],
      [0.5, 0.2],
      [0.5, 0.6],
      [1, 0.6],
      [1, 1],
    ],
  },
  {
    // Bowl: open lower half-circle.
    closed: false,
    sub: 1,
    corners: arc(16, (u) => [Math.cos(Math.PI * (1 + u)), Math.sin(Math.PI * (1 + u))]),
  },
  {
    // Zigzag: open W (4 edges x 4).
    closed: false,
    sub: 4,
    corners: [
      [-1, 0.7],
      [-0.5, -0.7],
      [0, 0.7],
      [0.5, -0.7],
      [1, 0.7],
    ],
  },
  {
    // Wave: open sine, two periods.
    closed: false,
    sub: 1,
    corners: arc(16, (u) => [2 * u - 1, 0.5 * Math.sin(u * Math.PI * 4)]),
  },
  {
    // Flower: four-petal rosette.
    closed: true,
    sub: 1,
    corners: ring(16, (t) => {
      const r = 1 + 0.35 * Math.cos(4 * t);
      return [r * Math.cos(t), r * Math.sin(t)];
    }),
  },
  {
    // Rounded triangle.
    closed: true,
    sub: 1,
    corners: ring(16, (t) => {
      const r = 1 + 0.3 * Math.cos(3 * t - Math.PI / 2);
      return [r * Math.cos(t), r * Math.sin(t)];
    }),
  },
  {
    // Squircle: superellipse.
    closed: true,
    sub: 1,
    corners: ring(16, (t) => {
      const c = Math.cos(t),
        s = Math.sin(t);
      return [Math.sign(c) * Math.abs(c) ** 0.5, Math.sign(s) * Math.abs(s) ** 0.5];
    }),
  },
  {
    // Oval: flattened ellipse.
    closed: true,
    sub: 1,
    corners: ring(16, (t) => [Math.cos(t), 0.55 * Math.sin(t)]),
  },
];
