// Living guilloche — runtime enhancement for fine pointers (hero + final CTA).
// Same seeded field as the static SVG; the phase drifts (one cycle ≈ 90s) and
// lines bend away from the cursor (≤ 6px within 180px, eased back over 600ms).
// Per-point trig is precomputed on resize, so a frame is only multiply-adds.
// Pauses offscreen and when the tab is hidden. DPR capped at 2.
import { makeField } from '../lib/guilloche.mjs';

type Field = ReturnType<typeof makeField>;
const CYCLE = 90_000;
const RADIUS = 180;
const PUSH = 6;
const EASE_BACK = 600;
const STEP = 7; // px between samples

interface Ring {
  alpha: number;
  n: number;
  base: Float32Array; // base radius (px) at each sample
  amp: Float32Array; // per-harmonic coefficients, interleaved [S0,C0,S1,C1,S2,C2] × n
  cos: Float32Array;
  sin: Float32Array;
}

export function initGuilloche(): void {
  document.querySelectorAll<HTMLElement>('[data-guilloche-host]').forEach(setup);
}

function setup(host: HTMLElement): void {
  const variant = host.dataset.guillocheHost === 'final' ? 'final' : 'hero';
  const anchor = host.querySelector<HTMLElement>(variant === 'hero' ? '.hero__coin' : '.final__fieldwrap');
  if (!anchor) return;
  const field: Field = makeField({ seed: variant === 'hero' ? 1913 : 2006, rings: 96 });
  const every = variant === 'final' ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.className = 'guilloche-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let rings: Ring[] = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let visible = false;
  let raf = 0;
  let px = -1e4;
  let py = -1e4;
  let strength = 0; // 0..1, eased
  let target = 0;
  let last = performance.now();
  const H3 = field.H;

  function layout() {
    const hr = host.getBoundingClientRect();
    const ar = anchor!.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(hr.width);
    H = Math.round(hr.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    cx = ar.left + ar.width / 2 - hr.left;
    cy = ar.top + ar.height / 2 - hr.top;
    const R = ar.width / 2;
    const margin = 24;
    rings = [];
    for (const g of field.rings) {
      if (g.i % every) continue;
      const rBase = g.base * R;
      const total = Math.max(64, Math.ceil((2 * Math.PI * rBase) / STEP));
      const keep: number[] = [];
      for (let j = 0; j <= total; j++) {
        const th = (j / total) * Math.PI * 2;
        const x = cx + rBase * Math.cos(th);
        const y = cy + rBase * Math.sin(th);
        if (x > -margin - 40 && x < W + margin + 40 && y > -margin - 40 && y < H + margin + 40) keep.push(th);
        else keep.push(NaN);
      }
      const n = keep.length;
      const base = new Float32Array(n);
      const amp = new Float32Array(n * 6);
      const cos = new Float32Array(n);
      const sin = new Float32Array(n);
      for (let j = 0; j < n; j++) {
        const th = keep[j]!;
        if (Number.isNaN(th)) {
          base[j] = NaN;
          continue;
        }
        base[j] = rBase;
        cos[j] = Math.cos(th);
        sin[j] = Math.sin(th);
        for (let h = 0; h < 3; h++) {
          const hh = H3[h]!;
          const a = g.amp * hh.a * R;
          const arg = hh.k * th + hh.p + g.i * hh.t;
          amp[j * 6 + h * 2] = a * Math.sin(arg);
          amp[j * 6 + h * 2 + 1] = a * Math.cos(arg);
        }
      }
      rings.push({ alpha: g.alpha, n, base, amp, cos, sin });
    }
  }

  function draw(now: number) {
    const dt = Math.min(64, now - last);
    last = now;
    strength += (target - strength) * Math.min(1, dt / (target > strength ? 160 : EASE_BACK / 3));
    const ph = ((now % CYCLE) / CYCLE) * Math.PI * 2;
    const c0 = Math.cos(ph * H3[0]!.w);
    const s0 = Math.sin(ph * H3[0]!.w);
    const c1 = Math.cos(ph * H3[1]!.w);
    const s1 = Math.sin(ph * H3[1]!.w);
    const c2 = Math.cos(ph * H3[2]!.w);
    const s2 = Math.sin(ph * H3[2]!.w);
    const bend = strength > 0.002;
    const r2 = RADIUS * RADIUS;

    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    ctx!.lineWidth = 0.75;
    for (const ring of rings) {
      ctx!.strokeStyle = `rgba(94,99,74,${ring.alpha})`;
      ctx!.beginPath();
      let pen = false;
      const { base, amp, cos, sin, n } = ring;
      for (let j = 0; j < n; j++) {
        const b = base[j]!;
        if (b !== b) {
          pen = false;
          continue;
        }
        const k = j * 6;
        // sin(A + φ) = sinA·cosφ + cosA·sinφ
        const r = b + amp[k]! * c0 + amp[k + 1]! * s0 + amp[k + 2]! * c1 + amp[k + 3]! * s1 + amp[k + 4]! * c2 + amp[k + 5]! * s2;
        let x = cx + r * cos[j]!;
        let y = cy + r * sin[j]!;
        if (bend) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RADIUS;
            const m = (PUSH * strength * f * f) / d;
            x += dx * m;
            y += dy * m;
          }
        }
        if (pen) ctx!.lineTo(x, y);
        else {
          ctx!.moveTo(x, y);
          pen = true;
        }
      }
      ctx!.stroke();
    }
  }

  function loop(now: number) {
    draw(now);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function start() {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  layout();
  draw(performance.now());
  host.classList.add('has-canvas');

  new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    start();
  }).observe(host);
  document.addEventListener('visibilitychange', start);
  let rt = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(rt);
    rt = requestAnimationFrame(() => {
      layout();
      draw(performance.now());
    });
  }).observe(host);
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    px = e.clientX - r.left;
    py = e.clientY - r.top;
    target = 1;
  });
  host.addEventListener('pointerleave', () => (target = 0));
  // Expose a frame-time probe for the performance test (no effect otherwise).
  (host as HTMLElement & { __guillocheFrame?: () => number }).__guillocheFrame = () => {
    const t = performance.now();
    draw(t);
    return performance.now() - t;
  };
}
