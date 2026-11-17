// Living guilloche — deterministic generator shared by the build (static SVG)
// and the runtime canvas. Echoes the logo's flowing line field without copying
// it: concentric rings around a focal point (the coin), each modulated by
// layered sinusoids whose phase twists ring to ring, so crests sweep around
// the focus like the arms of a rose engine.
//
// All harmonics are multiples of SYMMETRY, so one sector fully describes a
// ring; the static SVG draws one sector and repeats it (6× smaller file).

export const SYMMETRY = 6;

/** mulberry32 — tiny seeded PRNG. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {{ seed?: number, rings?: number, inner?: number, outer?: number }} [o]
 * Radii are in units of the coin radius R.
 */
export function makeField(o = {}) {
  const { seed = 1776, rings = 96, inner = 1.07, outer = 4.4 } = o;
  const r = rng(seed);
  const S = SYMMETRY;
  const H = [
    { k: S, a: 0.07 + r() * 0.02, p: r() * 6.283, t: 0.045 + r() * 0.02, w: 1 },
    { k: 2 * S, a: 0.022 + r() * 0.01, p: r() * 6.283, t: -0.07 - r() * 0.03, w: -1.5 },
    { k: 4 * S, a: 0.006 + r() * 0.004, p: r() * 6.283, t: 0.11, w: 2 },
  ];
  const list = [];
  for (let i = 0; i < rings; i++) {
    const u = i / (rings - 1);
    // Denser near the coin, opening outward: the field sweeps away from the focus.
    const base = inner + (outer - inner) * (0.62 * u + 0.38 * u * u);
    // Amplitude ramps up away from the coin so the inner edge stays a calm halo.
    const ramp = Math.min(1, u / 0.35);
    list.push({ base, amp: (0.25 + 0.75 * ramp * ramp * (3 - 2 * ramp)) * (0.7 + 0.3 * Math.sin(u * Math.PI)), alpha: 0.35 + 0.25 * r(), i });
  }
  return { H, rings: list };
}

/** Radius (in R) of ring `g` at angle `th`, with time phase `ph` (radians). */
export function ringRadius(field, g, th, ph = 0) {
  let r = g.base;
  for (const h of field.H) r += g.amp * h.a * Math.sin(h.k * th + h.p + g.i * h.t + ph * h.w);
  return r;
}

/**
 * Static SVG: one sector per ring, repeated SYMMETRY times with <use>.
 * @param {{ field: ReturnType<typeof makeField>, R?: number, step?: number, every?: number }} o
 */
export function fieldSvg({ field, R = 100, step = 4, every = 1 }) {
  const S = SYMMETRY;
  const sector = (2 * Math.PI) / S;
  const ext = field.rings.at(-1).base * R * 1.12;
  const size = Math.ceil(ext);
  const f1 = (n) => Math.round(n * 10) / 10;
  let paths = '';
  for (const g of field.rings) {
    if (g.i % every) continue;
    const n = Math.max(12, Math.ceil((sector * g.base * R) / step));
    let d = '';
    let px = 0;
    let py = 0;
    for (let j = 0; j <= n; j++) {
      // exact sector endpoints + butt caps: repeated sectors abut without doubling
      const th = (j / n) * sector;
      const rr = ringRadius(field, g, th) * R;
      const x = f1(rr * Math.cos(th));
      const y = f1(rr * Math.sin(th));
      d += j === 0 ? `M${x} ${y}` : `l${f1(x - px)} ${f1(y - py)}`;
      px = x;
      py = y;
    }
    paths += `<path d="${d}" stroke-opacity="${g.alpha.toFixed(2)}"/>`;
  }
  let uses = '';
  for (let k = 1; k < S; k++) uses += `<use href="#s" transform="rotate(${(360 / S) * k})"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-size} ${-size} ${2 * size} ${2 * size}">` +
    `<g id="field" fill="none" stroke="#5E634A" stroke-width="0.75" stroke-linecap="butt" vector-effect="non-scaling-stroke">` +
    `<g id="s">${paths.replaceAll('<path ', '<path vector-effect="non-scaling-stroke" ')}</g>${uses}</g></svg>`
  );
}

/** Ratio of the SVG's half-size to R, so CSS can place it centred on the coin. */
export function fieldExtent(field) {
  return Math.ceil(field.rings.at(-1).base * 100 * 1.12) / 100;
}
