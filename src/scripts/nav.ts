// Mobile overlay menu: focus trap, Esc closes, background inert, focus restored.
// Opening and closing never moves the page: the scroll lock is overflow:hidden on
// <html> only (base.css, with scrollbar-gutter: stable so the scrollbar's space
// never comes or goes), nothing here calls scrollTo, and every focus call uses
// preventScroll. A plain focus() on the toggle, which sits in the sticky nav
// inside html's 88px scroll-padding, made the browser scroll the page about half
// a viewport on every close.
export function initNav(): void {
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!open || !menu || !close) return;
  open.hidden = false;

  const outside = () => [...document.body.children].filter((el) => el !== menu && el.tagName !== 'SCRIPT') as HTMLElement[];
  const focusables = () =>
    [...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0]!;
    const last = f[f.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  function show() {
    menu!.hidden = false;
    menu!.classList.add('is-open');
    open!.setAttribute('aria-expanded', 'true');
    outside().forEach((el) => (el.inert = true));
    document.documentElement.classList.add('is-menu-open');
    document.addEventListener('keydown', onKey);
    focusables()[0]?.focus({ preventScroll: true });
  }
  function hide(restore = true) {
    menu!.hidden = true;
    menu!.classList.remove('is-open');
    open!.setAttribute('aria-expanded', 'false');
    outside().forEach((el) => (el.inert = false));
    document.documentElement.classList.remove('is-menu-open');
    document.removeEventListener('keydown', onKey);
    if (restore) open!.focus({ preventScroll: true });
  }

  open.addEventListener('click', show);
  close.addEventListener('click', () => hide());
  menu.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => hide(false)));
  matchMedia('(min-width: 1100px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) hide(false);
  });
}
