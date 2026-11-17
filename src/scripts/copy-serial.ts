// Copy the serial. Live state only (buttons are disabled pre-issue).
export function initCopy(): void {
  const live = document.getElementById('live-status');
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.textContent ?? 'Copy';
    let timer = 0;
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy ?? '';
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        // Clipboard unavailable: select the serial so it can be copied by hand.
        const code = btn.parentElement?.querySelector('[data-serial]');
        if (code) {
          const r = document.createRange();
          r.selectNodeContents(code);
          const s = getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
        }
        return;
      }
      if (label) label.textContent = btn.dataset.copied ?? 'Copied';
      if (live) live.textContent = 'Serial copied.';
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = original;
        if (live) live.textContent = '';
      }, 1800);
    });
  });
}
