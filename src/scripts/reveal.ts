// Ink reveals, hairline draws and the Fourth Issue's dissolving frame.
// Only elements below the fold at load are ever hidden, so nothing visible at
// first paint is clipped or flashes (the hero H1 is always painted at once).
// Nothing here forces a synchronous layout.
export function initReveal(reduced: boolean): void {
  if (!('IntersectionObserver' in window)) return;

  // Pause the map hatch drift offscreen.
  const mapIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-visible', e.isIntersecting)));
  document.querySelectorAll('.map').forEach((m) => mapIO.observe(m));

  if (reduced) return;

  const set = (el: Element, v: string) => {
    const h = el as HTMLElement;
    if (h.hasAttribute('data-ink')) h.dataset.ink = v;
    if (h.hasAttribute('data-draw')) h.dataset.draw = v;
  };

  // Reveal: fires as pending elements come into view.
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        set(el, 'in');
        reveal.unobserve(el);
        // Once the impression is pulled (1200ms + stagger ≤ 500ms), drop the mask entirely.
        window.setTimeout(() => {
          if ((el as HTMLElement).dataset.ink === 'in') (el as HTMLElement).dataset.ink = 'done';
        }, 1900);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  // Classify from the observer's first report (no forced layout): anything on
  // screen or above it at load stays as painted; only what is below the fold —
  // never yet seen — is set to its pre-impression state.
  const classify = new IntersectionObserver((entries) => {
    for (const e of entries) {
      classify.unobserve(e.target);
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) continue;
      set(e.target, 'pending');
      reveal.observe(e.target);
    }
  });
  document.querySelectorAll('[data-ink], [data-draw]').forEach((el) => classify.observe(el));
}
