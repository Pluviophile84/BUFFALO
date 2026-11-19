// Single entry. Every module is a progressive enhancement: the page is complete
// and correct without JavaScript.
import { initStrike } from './strike';
import { initNav } from './nav';
import { initReveal } from './reveal';
import { initCopy } from './copy-serial';
import { initMark } from './mark';
import { initCards } from './cards';
import { initField } from './field';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
initStrike(reduced);
initNav();
initReveal(reduced);
initCopy();
initMark(reduced);
initCards(reduced);
initField();

if (!reduced && matchMedia('(pointer: fine)').matches && document.querySelector('[data-guilloche-host]')) {
  import('./guilloche-canvas').then((m) => m.initGuilloche());
}
