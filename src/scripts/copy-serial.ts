// Copy the mint address. Live state only (buttons are disabled pre-issue).
// When the clipboard is unavailable or denied, the address in the same block
// ([data-serial-scope]: the serial module in the hero and final section, the
// Specification's serial row) is selected instead; the button says so and the
// live region announces it. After 3s the button is restored and the selection
// stays, so the address can still be copied by hand.
export function initCopy(): void {
  const live = document.getElementById('live-status');
  const announce = (text: string) => {
    if (!live) return;
    live.textContent = ''; // a repeated message is announced again
    requestAnimationFrame(() => (live.textContent = text));
  };
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.textContent ?? 'Copy';
    let timer = 0;
    const show = (text: string, message: string, ms: number, manual: boolean) => {
      if (label) label.textContent = text;
      btn.classList.toggle('is-manual', manual);
      announce(message);
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = original;
        btn.classList.remove('is-manual');
        if (live) live.textContent = '';
      }, ms);
    };
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      } catch {
        const code = btn.closest('[data-serial-scope]')?.querySelector('[data-serial]');
        if (code) {
          const r = document.createRange();
          r.selectNodeContents(code);
          const s = getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
        }
        show(btn.dataset.manual ?? 'Selected — copy manually', btn.dataset.manualAnnounce ?? '', 3000, true);
        return;
      }
      show(btn.dataset.copied ?? 'Copied', 'Serial copied.', 1800, false);
    });
  });
}
