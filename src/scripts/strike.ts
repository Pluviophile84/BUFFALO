// The strike plays from first paint via CSS (no flash, no render-blocking JS).
// Once per session: on later views this finishes it immediately.
const KEY = 'buffalo:struck';

export function initStrike(reduced: boolean): void {
  const coin = document.querySelector<HTMLElement>('.coin--strike');
  if (!coin) return;
  let seen = false;
  try {
    seen = sessionStorage.getItem(KEY) === '1';
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage unavailable: play normally */
  }
  if (seen || reduced) coin.classList.add('coin--struck');
}
