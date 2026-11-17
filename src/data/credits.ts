// Image credits and fact sources (brief §6, §11.4). Mirrored in ASSET-SOURCES.md.
import history from './history.json';

export const IMAGE_CREDITS = [
  {
    title: '1901 United States Note, $10 (the “Bison Note”)',
    used: 'Card I · Issue I',
    source: 'Wikimedia Commons, File:US $10 1901.jpg',
    url: 'https://commons.wikimedia.org/wiki/File:US_$10_1901.jpg',
    license: 'Public domain (United States currency, U.S. Government work).',
    file: `Vetted baseline from the previous site, ${history['note-1901'].original.width} × ${history['note-1901'].original.height} px. No recoloring or retouching.`,
  },
  {
    title: 'Buffalo nickel, reverse (James Earle Fraser, 1913)',
    used: 'Card II · Issue II',
    source: 'United States Mint',
    url: 'https://www.usmint.gov/learn/coins-and-medals/circulating-coins/nickel',
    license: 'Public domain (U.S. Mint image, U.S. Government work).',
    file: `Vetted baseline from the previous site, ${history['nickel-1913'].original.width} × ${history['nickel-1913'].original.height} px. Cut out onto its plate with a lossless circular mask; pixels unaltered.`,
  },
  {
    title: 'American Buffalo gold coin, 2006 proof, reverse',
    used: 'Card III · Issue III',
    source: 'United States Mint, via Wikimedia Commons, File:2006 American Buffalo Proof Reverse.jpg',
    url: 'https://commons.wikimedia.org/wiki/File:2006_American_Buffalo_Proof_Reverse.jpg',
    license: 'Public domain. The file page states: “Like all US Mint images, this image is in the public domain as a work of the US government.” (PD-USGov-money).',
    file: `Commons 1280 px rendition of the 2000 × 2000 original, used at ${history['gold-2006'].original.width} × ${history['gold-2006'].original.height} px. Cut out onto its plate with a lossless circular mask; pixels unaltered.`,
  },
];

export const FACT_SOURCES = [
  { label: 'National Park Service — 15 facts about bison', url: 'https://www.nps.gov/articles/15-facts-about-bison.htm' },
  { label: 'National Park Service, Wind Cave — Bison', url: 'https://home.nps.gov/wica/learn/nature/bison-buffalo-bison-bison.htm' },
  { label: 'United States Mint — American Buffalo coins', url: 'https://www.usmint.gov/coins/coin-programs/american-buffalo-coins/' },
  { label: 'United States Mint — Nickel', url: 'https://www.usmint.gov/learn/coins-and-medals/circulating-coins/nickel' },
  { label: 'Fonts In Use — The Dunlap broadside (Caslon)', url: 'https://www.fontsinuse.com/uses/1666/the-dunlap-broadside' },
];
