// The guilloche field's path data (≈44 KB) is referenced once the page has loaded,
// so it never competes with the LCP image for bandwidth and never blocks first
// render. Without JavaScript, the field's <noscript> copy references it directly.
export function initField(): void {
  const attach = () =>
    document.querySelectorAll<SVGUseElement>('use[data-field-href]').forEach((u) => u.setAttribute('href', u.dataset.fieldHref!));
  if (document.readyState === 'complete') attach();
  else window.addEventListener('load', attach, { once: true });
}
