// Provenance, mobile: the card scroller's counter (1 / 4) and ‹ › controls.
// Each control scrolls exactly one card and keeps scroll-snap; both disable at the
// ends; the counter follows swipes too. Only while the cards scroll sideways
// (< 768px); without JavaScript the controls stay hidden.
export function initCards(reduced: boolean): void {
  const scroller = document.querySelector<HTMLElement>('.provenance__scroller');
  const nav = document.querySelector<HTMLElement>('[data-cards-nav]');
  if (!scroller || !nav || !('IntersectionObserver' in window)) return;
  const cards = [...scroller.querySelectorAll<HTMLElement>('.card')];
  const prev = nav.querySelector<HTMLButtonElement>('[data-cards-prev]')!;
  const next = nav.querySelector<HTMLButtonElement>('[data-cards-next]')!;
  const count = nav.querySelector<HTMLElement>('[data-cards-count]')!;
  const countSr = nav.querySelector<HTMLElement>('[data-cards-count-sr]')!;
  const ratio = new Map<Element, number>();
  let index = 0;

  const render = () => {
    count.textContent = `${index + 1} / ${cards.length}`;
    countSr.textContent = `Card ${index + 1} of ${cards.length}.`;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  };
  // The current card is the most visible one (the last wins a tie: at the end of the
  // scroller the last card is whole while the one before is cut).
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratio.set(e.target, e.intersectionRatio);
      let best = 0;
      cards.forEach((c, i) => {
        if ((ratio.get(c) ?? 0) >= (ratio.get(cards[best]!) ?? 0) - 0.001) best = i;
      });
      if (best !== index) {
        index = best;
        render();
      }
    },
    { root: scroller, threshold: [0, 0.25, 0.5, 0.75, 0.9, 1] },
  );
  const go = (i: number) => {
    const to = Math.max(0, Math.min(cards.length - 1, i));
    const pad = parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) || 0;
    const left = scroller.scrollLeft + cards[to]!.getBoundingClientRect().left - scroller.getBoundingClientRect().left - pad;
    scroller.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
    index = to; // the target, so a second press moves on from it
    render();
  };
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));

  const mq = matchMedia('(max-width: 767px)');
  const setMode = () => {
    nav.hidden = !mq.matches;
    nav.parentElement?.classList.toggle('has-nav', mq.matches);
    if (mq.matches) cards.forEach((c) => io.observe(c));
    else io.disconnect();
  };
  render();
  setMode();
  mq.addEventListener('change', setMode);
}
