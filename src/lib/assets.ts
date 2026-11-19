// Fingerprinted asset URLs. The brand layers and the Custodian Kit live in
// src/assets/, so the build emits each file as /_astro/<name>.<content hash>.<ext>:
// a corrected image gets a new URL, and only such URLs are cached as immutable
// (vercel.json). Files are looked up by their source name; a missing one fails the build.
const brand = import.meta.glob<string>('../assets/brand/*', { query: '?url', import: 'default', eager: true });
const kit = import.meta.glob<string>('../assets/kit/**/*', { query: '?url', import: 'default', eager: true });

const find = (files: Record<string, string>, dir: string, name: string) => {
  const url = files[`../assets/${dir}/${name}`];
  if (!url) throw new Error(`Missing asset src/assets/${dir}/${name}`);
  return url;
};

/** A served brand layer (src/assets/brand), e.g. brandUrl('bison-1023.webp'). */
export const brandUrl = (name: string) => find(brand, 'brand', name);
/** A Custodian Kit file (src/assets/kit), by its name in kit.json, e.g. 'previews/b.webp'. */
export const kitUrl = (name: string) => find(kit, 'kit', name);
