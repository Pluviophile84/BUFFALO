// The Mark: hotspots ↔ annotations, layer dimming, keyboard cycling; ket decoder.
//
// Two columns (≥ 1024px): as before. Hover or focus previews a part, a click pins
// it (and a second click unpins), the list beside the coin explains it.
//
// One column: a guided tour. The list would sit far below the coin, off screen, so
// it is replaced by one caption card directly under the coin. Item 1 is active as
// soon as the tour starts; a hotspot, the ‹ › buttons, a horizontal swipe on the
// card or the arrow keys (on the card or the hotspots) change it, wrapping around.
// The active hotspot (aria-pressed), the coin's layer highlight and the card always
// show the same item. Nothing advances on its own.
export function initMark(reduced: boolean): void {
  const root = document.querySelector<HTMLElement>('[data-mark]');
  if (!root) return;
  const spots = [...root.querySelectorAll<HTMLButtonElement>('[data-spot]')];
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')];
  const ids = spots.map((s) => s.dataset.spot!);
  const card = root.querySelector<HTMLElement>('[data-tour]');
  let pressed: string | null = null;
  let touring = false;

  const paint = (id: string | null) => {
    if (id) root.dataset.active = id;
    else delete root.dataset.active;
    spots.forEach((s) => s.classList.toggle('is-hot', s.dataset.spot === id));
    items.forEach((it) => it.classList.toggle('is-hot', it.dataset.item === id));
  };
  const setPressed = (id: string | null) => {
    pressed = id;
    spots.forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.spot === pressed)));
    picks.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.pick === pressed)));
    paint(pressed);
    if (touring) showCard();
  };

  // ── the tour card ──
  const live = card?.querySelector<HTMLElement>('[data-tour-live]');
  const sizes = card ? [...card.querySelectorAll<HTMLElement>('[data-tour-size]')] : [];
  const count = card?.querySelector<HTMLElement>('[data-tour-count]');
  const countSr = card?.querySelector<HTMLElement>('[data-tour-count-sr]');
  const pad = (n: number) => String(n).padStart(2, '0');
  const showCard = () => {
    const i = Math.max(0, ids.indexOf(pressed ?? ids[0]!));
    const src = sizes[i];
    if (!live || !src) return;
    live.replaceChildren(...[...src.childNodes].map((n) => n.cloneNode(true)));
    if (count) count.textContent = `${pad(i + 1)} / ${pad(ids.length)}`;
    if (countSr) countSr.textContent = `Part ${i + 1} of ${ids.length}.`;
  };
  /** Tour: make `id` the active item; the hotspot becomes the one in the tab order. */
  const select = (id: string) => {
    setPressed(id);
    spots.forEach((s) => (s.tabIndex = s.dataset.spot === id ? 0 : -1));
  };
  const step = (d: number) => select(ids[(ids.indexOf(pressed ?? ids[0]!) + d + ids.length) % ids.length]!);

  // Two columns: click pins/unpins; one column: a hotspot shows its item.
  const press = (id: string) => (touring ? select(id) : setPressed(pressed === id ? null : id));
  const preview = (id: string) => {
    if (!touring) paint(id);
  };
  const settle = () => paint(pressed);

  for (const el of [...spots, ...picks]) {
    const id = (el.dataset.spot ?? el.dataset.pick)!;
    el.addEventListener('pointerenter', () => preview(id));
    el.addEventListener('pointerleave', settle);
    el.addEventListener('focus', () => preview(id));
    el.addEventListener('blur', settle);
    el.addEventListener('click', () => press(id));
  }

  const keyStep = (key: string, i: number) => {
    if (key === 'ArrowRight' || key === 'ArrowDown') return (i + 1) % ids.length;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (i - 1 + ids.length) % ids.length;
    if (key === 'Home') return 0;
    if (key === 'End') return ids.length - 1;
    return -1;
  };

  // Roving focus across hotspots: arrows cycle, Home/End jump (and, on the tour,
  // the card follows).
  root.querySelector('.coin')?.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent;
    const i = spots.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const n = keyStep(e.key, i);
    if (n < 0) return;
    e.preventDefault();
    if (touring) select(ids[n]!);
    else spots.forEach((s, k) => (s.tabIndex = k === n ? 0 : -1));
    spots[n]!.focus();
  });

  if (card) {
    card.querySelector('[data-tour-prev]')?.addEventListener('click', () => step(-1));
    card.querySelector('[data-tour-next]')?.addEventListener('click', () => step(1));
    card.addEventListener('keydown', (e) => {
      const n = keyStep(e.key, Math.max(0, ids.indexOf(pressed ?? ids[0]!)));
      if (n < 0) return;
      e.preventDefault();
      select(ids[n]!);
    });
    // Swipe: at least 40px, and mostly horizontal. The card is touch-action: pan-y,
    // so a vertical drag stays a page scroll (the browser takes it and the pointer is
    // cancelled); only horizontal movement reaches here.
    let start: { x: number; y: number; id: number } | null = null;
    card.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.target as Element).closest('button')) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    card.addEventListener('pointercancel', () => (start = null));
    card.addEventListener('pointerup', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
    });
  }

  // The tour runs wherever the Mark is one column (below the two-column breakpoint).
  const single = matchMedia('(max-width: 1023px)');
  const setMode = () => {
    const on = !!card && single.matches;
    if (on === touring) return;
    touring = on;
    root.classList.toggle('mark--tour', on);
    if (card) card.hidden = !on;
    if (on) select(pressed ?? ids[0]!);
  };
  setMode();
  single.addEventListener('change', setMode);

  // Ket decoder: each byte resolves into its letter in turn (700ms), then holds.
  const ket = root.querySelector<HTMLButtonElement>('[data-ket]');
  if (ket) {
    const bytes = [...ket.querySelectorAll<HTMLElement>('.ket__byte')];
    let done = false;
    const decode = () => {
      if (done) return;
      done = true;
      const stepMs = reduced ? 0 : 700 / bytes.length;
      bytes.forEach((b, i) => window.setTimeout(() => b.classList.add('is-read'), i * stepMs));
    };
    ket.addEventListener('pointerenter', decode);
    ket.addEventListener('focus', decode);
    ket.addEventListener('click', decode);
  }
}
