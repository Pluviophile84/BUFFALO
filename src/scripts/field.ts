// The guilloche field's path data (≈44 KB) is referenced once the page has loaded,
// so it never competes with the LCP image for bandwidth and never blocks first
// render. Without JavaScript, the field's <noscript> copy references it directly.
//
// Laying out and painting all 162 paths at once was one long main-thread task right
// after first paint (most of the page's Total Blocking Time on a mid-range phone).
// So the paths come in groups (#field-1 …, scripts/build-generated.mjs), and each
// group is attached in its own idle callback: the same drawing, in short tasks.
// A field the fine-pointer canvas draws instead (scripts/guilloche-canvas.ts) is
// hidden under it, so it is not attached at all unless the canvas gives up.

/** requestIdleCallback, or a timeout where it is missing (Safari). */
export const idle = (cb: () => void, timeout = 2000) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(() => cb(), { timeout }) : window.setTimeout(cb, 16);

const pending = (field: Element) => [...field.querySelectorAll<SVGUseElement>('use[data-field-href]:not([href])')];

/** Attach a field's groups, one per idle callback. */
export function attachField(field: Element): void {
  const uses = pending(field);
  const next = () => {
    const u = uses.shift();
    if (!u) return;
    u.setAttribute('href', u.dataset.fieldHref!);
    if (uses.length) idle(next);
  };
  idle(next);
}

const afterLoad = (cb: () => void) => (document.readyState === 'complete' ? cb() : window.addEventListener('load', cb, { once: true }));

/** Every field on the page (the canvas could not run). */
export const attachAll = () => afterLoad(() => document.querySelectorAll('.field').forEach(attachField));

/** @param canvas the fine-pointer canvas will draw the fields of [data-guilloche-host] */
export function initField(canvas: boolean): void {
  afterLoad(() =>
    document.querySelectorAll('.field').forEach((field) => {
      if (canvas && field.closest('[data-guilloche-host]')) return; // drawn by the canvas
      attachField(field);
    }),
  );
}
