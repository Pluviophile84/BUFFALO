// Guilloche canvas — runtime layer for fine pointers (hero + final CTA), drawing
// the same field as the static SVG: the logo's own guilloche paths, as Path2D
// from their d strings, in the same box with the same stroke and clear ring.
// The lines are the logo's fixed paths, so they are drawn static: the old
// generated field's phase drift and pointer bend recomputed its ring equations
// and cannot apply to fixed paths. Redrawn only when the layout changes.
// DPR capped at 2. The path data is fetched from the same file the SVG uses,
// after the page has loaded and when the main thread is idle, so it never blocks
// first render or competes with the LCP image. It is fetched and parsed once and
// shared by every host. The static SVG under a canvas is never attached (it would
// be hidden); if the file cannot be read, the canvas goes and the SVG is attached.
import generated from '../data/generated.json';
import { attachField, idle } from './field';

const F = generated.field;

// One fetch and one parse for all hosts (the hero and the final section).
const shared = new Map<string, Promise<Path2D[]>>();
const pathsFrom = (src: string) => {
  let p = shared.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => new Path2D(m[1])));
    shared.set(src, p);
  }
  return p;
};

export function initGuilloche(): void {
  document.querySelectorAll<HTMLElement>('[data-guilloche-host]').forEach(setup);
}

function setup(host: HTMLElement): void {
  const field = host.querySelector<HTMLElement>('.field');
  const src = field?.dataset.fieldSrc;
  if (!field) return;
  if (!src) return attachField(field);
  const canvas = document.createElement('canvas');
  canvas.className = 'guilloche-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return attachField(field); // no canvas here: the static SVG instead
  host.prepend(canvas);
  host.classList.add('has-canvas');

  let paths: Path2D[] = [];

  function draw() {
    if (!paths.length) return;
    const hr = host.getBoundingClientRect();
    const fr = field!.getBoundingClientRect(); // the field's own box: ±4.93R around the anchor
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(hr.width);
    const H = Math.round(hr.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const R = fr.width / (2 * F.extent);
    const cx = fr.left + fr.width / 2 - hr.left;
    const cy = fr.top + fr.height / 2 - hr.top;
    const k = (F.outer * R) / F.disc; // px per master unit: the logo's disc edge at 4.4R
    const alpha = parseFloat(getComputedStyle(field!).getPropertyValue('--field-canvas-alpha')) || 0.475;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    ctx!.save();
    ctx!.beginPath(); // clear inside 1.07R, the calm ring around the anchor
    ctx!.rect(0, 0, W, H);
    ctx!.arc(cx, cy, F.inner * R, 0, Math.PI * 2);
    ctx!.clip('evenodd');
    ctx!.setTransform(dpr * k, 0, 0, dpr * k, dpr * (cx - F.center[0]! * k), dpr * (cy - F.center[1]! * k));
    ctx!.lineWidth = 0.75 / k; // 0.75 CSS px, as the SVG's non-scaling stroke
    ctx!.lineCap = 'round';
    ctx!.strokeStyle = `rgba(94,99,74,${alpha})`;
    for (const p of paths) ctx!.stroke(p);
    ctx!.restore();
  }

  // after the page has loaded and the main thread is idle (as the static field)
  const loaded = new Promise<void>((res) => (document.readyState === 'complete' ? res() : window.addEventListener('load', () => res(), { once: true })));
  loaded
    .then(() => new Promise<void>((res) => idle(res)))
    .then(() => pathsFrom(src))
    .then((p) => {
      paths = p;
      idle(draw);
    })
    .catch(() => {
      canvas.remove();
      host.classList.remove('has-canvas');
      attachField(field); // back to the static SVG
    });

  let rt = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(rt);
    rt = requestAnimationFrame(draw);
  }).observe(host);
  // Draw-time probe for the performance test (no effect otherwise).
  (host as HTMLElement & { __guillocheDraw?: () => number }).__guillocheDraw = () => {
    const t = performance.now();
    draw();
    return performance.now() - t;
  };
}
