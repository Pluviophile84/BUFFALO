// The Mark: hotspots ↔ annotations, layer dimming, keyboard cycling; ket decoder.
export function initMark(reduced: boolean): void {
  const root = document.querySelector<HTMLElement>('[data-mark]');
  if (!root) return;
  const spots = [...root.querySelectorAll<HTMLButtonElement>('[data-spot]')];
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')];
  const ids = spots.map((s) => s.dataset.spot!);
  let pressed: string | null = null;

  const paint = (id: string | null) => {
    if (id) root.dataset.active = id;
    else delete root.dataset.active;
    spots.forEach((s) => s.classList.toggle('is-hot', s.dataset.spot === id));
    items.forEach((it) => it.classList.toggle('is-hot', it.dataset.item === id));
  };
  const press = (id: string) => {
    pressed = pressed === id ? null : id;
    spots.forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.spot === pressed)));
    picks.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.pick === pressed)));
    paint(pressed);
  };
  const preview = (id: string) => paint(id);
  const settle = () => paint(pressed);

  for (const el of [...spots, ...picks]) {
    const id = (el.dataset.spot ?? el.dataset.pick)!;
    el.addEventListener('pointerenter', () => preview(id));
    el.addEventListener('pointerleave', settle);
    el.addEventListener('focus', () => preview(id));
    el.addEventListener('blur', settle);
    el.addEventListener('click', () => press(id));
  }

  // Roving focus across hotspots: arrows cycle, Home/End jump.
  root.querySelector('.coin')?.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent;
    const i = spots.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let n = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % spots.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + spots.length) % spots.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = spots.length - 1;
    else return;
    e.preventDefault();
    spots.forEach((s, k) => (s.tabIndex = k === n ? 0 : -1));
    spots[n]!.focus();
  });
  void ids;

  // Ket decoder: each byte resolves into its letter in turn (700ms), then holds.
  const ket = root.querySelector<HTMLButtonElement>('[data-ket]');
  if (ket) {
    const bytes = [...ket.querySelectorAll<HTMLElement>('.ket__byte')];
    let done = false;
    const decode = () => {
      if (done) return;
      done = true;
      const step = reduced ? 0 : 700 / bytes.length;
      bytes.forEach((b, i) => window.setTimeout(() => b.classList.add('is-read'), i * step));
    };
    ket.addEventListener('pointerenter', decode);
    ket.addEventListener('focus', decode);
    ket.addEventListener('click', decode);
  }
}
