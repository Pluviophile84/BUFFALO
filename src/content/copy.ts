// Final copy (brief §5). Do not paraphrase, add hype, exclamation marks or emoji.
// Paired [PRE]/[LIVE] strings are resolved at build time via pick(); only the
// active state's string is emitted to HTML.
//
// Typography: straight apostrophes from the brief are set as typographic
// apostrophes (’). Nothing else differs from the brief. The copy test
// normalizes ’ → ' when comparing against the brief.
import { issue, pick } from '../lib/issue-state';

export const NAV = {
  links: [
    { href: '#provenance', label: 'Provenance' },
    { href: '#character', label: 'Character' },
    { href: '#mark', label: 'The Mark' },
    { href: '#specification', label: 'Specification' },
    { href: '#acquire', label: 'Acquire' },
    { href: '#custodians', label: 'Custodians' },
  ],
  cta: 'Acquire $BUFFALO',
};

export const ACTION = {
  acquire: pick('Issue pending', 'Acquire $BUFFALO'),
  availableAtIssue: 'Available at issue',
  copy: 'Copy',
  copied: 'Copied',
};

export const HERO = {
  eyebrow: `THE FOURTH ISSUE · SERIES ${issue.seriesYear}`,
  // H1 in two tones: the three issues, then the new chapter
  h1: ['Paper. Nickel. Gold.', 'Blockchain.'],
  sub: 'An American monetary symbol, carried into its next form.',
  secondary: 'Read the provenance',
  serialLabel: 'SERIAL · MINT ADDRESS',
  serialPending: 'To be struck at issue',
  stamp: 'SPECIMEN · PRE-ISSUE',
};

export const STRIP = [
  { label: 'STATUS', value: issue.statusLabel },
  { label: 'NETWORK', value: 'Solana' },
  { label: 'ISSUANCE', value: 'pump.fun' },
  { label: 'SERIAL', value: issue.serialShort ?? 'To be struck at issue' },
  { label: 'ISSUE DATE', value: issue.issueDateLabel },
];

export const STATEMENT = {
  label: 'I · STATEMENT OF ISSUE',
  lines: [
    'Long before it was money, the bison was a force of nature. Immense. Unbowed. Built to outlast whatever the plains could send against it.',
    'A nation put it on its money to borrow that character, and each era carried it in the material of its time.',
    'The fourth issue is minted on-chain: the same symbol, in the medium of this century.',
    'The history is still being written.',
  ],
  signature: 'BUFFALO — THE FOURTH ISSUE',
};

// Standalone lines: their own bands, between sections (Interlude.astro).
export const INTERLUDE = {
  // between I · Statement and II · Provenance
  archives: ['Some memecoins begin with invented lore. BUFFALO arrived with archives.'],
  // between III · Character and IV · The Release: "Not a dog." in --cream-2,
  // "Not a frog." in --cream; nothing after them (the reader completes the line)
  buffalo: ['Not a dog.', 'Not a frog.'],
};

export const PROVENANCE = {
  label: 'II · PROVENANCE',
  h2: 'Four forms. One symbol.',
  intro: 'For more than a century, the bison has marked American money. Here are three of its landmarks, and the fourth form. Each changed the material. None changed the animal.',
  cards: [
    {
      label: 'SERIES 1901 · ISSUE I · PAPER',
      title: 'The bison takes center stage.',
      body: 'The ten-dollar United States Note of 1901 places a bison at the center of the design, flanked by portraits of Meriwether Lewis and William Clark. Collectors still call it the Bison Note.',
      wit: 'The first financial migration.',
      caption: '1901 United States Note, $10. Public-domain reproduction via Wikimedia Commons.',
    },
    {
      label: 'SERIES 1913 · ISSUE II · NICKEL',
      title: 'The symbol goes into every pocket.',
      body: 'James Earle Fraser’s Buffalo nickel takes the bison from a ten-dollar note to a five-cent coin, in everyday circulation from 1913 to 1938.',
      wit: 'Portable conviction. Five cents at a time.',
      caption: 'Buffalo nickel, reverse. Design by James Earle Fraser. Image: United States Mint.',
    },
    {
      label: 'SERIES 2006 · ISSUE III · GOLD',
      title: 'The symbol returns in pure gold.',
      body: 'The United States Mint revives Fraser’s design for the American Buffalo, the first .9999 fine, 24-karat gold coin the Mint ever struck.',
      wit: 'Same animal. Heavier balance sheet.',
      caption: 'American Buffalo gold coin, introduced 2006. Image: United States Mint.',
    },
    {
      label: `SERIES ${issue.seriesYear} · ISSUE IV · CHAIN`,
      title: 'The bison enters the blockchain.',
      body: '$BUFFALO carries the same symbol into its fourth medium: a token minted on Solana. The material changes again. The animal does not.',
      wit: 'No vault required.',
      caption: pick(
        'Pre-issue. See the Specification for the official mint address.',
        'In circulation. Verify the official mint address in the Specification.',
      ),
    },
  ],
};

export const CHARACTER = {
  label: 'III · CHARACTER',
  h2: 'The character came first.',
  intro: 'Nations choose symbols for the qualities they want to be seen to have. The United States chose the bison for these.',
  traits: [
    { n: '01', word: 'Strength', text: 'The largest land mammal in North America. A bull can weigh up to a ton and still run at thirty-five miles an hour.' },
    { n: '02', word: 'Resilience', text: 'Tens of millions once crossed the plains. By 1900, fewer than a thousand remained. It came back.' },
    { n: '03', word: 'Boldness', text: 'Nothing about it asks permission. Not its size, not its stride, not its stare.' },
  ],
  closing: 'The nation did not invent these qualities. It borrowed them. The Fourth Issue returns them to the symbol.',
};

export const RELEASE = {
  label: 'IV · THE RELEASE',
  h2: 'For a century, its power had borders. On the chain, it has none.',
  body: 'A banknote stops at a border. A coin is legal tender in one country. The Fourth Issue moves at the speed of a block, to anyone holding a wallet, anywhere on the map.',
  wit: 'A century-long migration. Reasonably on schedule.',
  ledger: ['No treasury.', 'No border.', 'No jurisdiction.'],
  caption: 'MAP DRAWN WITHOUT A SINGLE BORDER LINE.',
};

export const MARK = {
  label: 'V · THE MARK',
  h2: 'Every era, struck into one coin.',
  intro: 'The emblem carries the full provenance, past, present and what comes next, so that its era cannot be pinned down.',
  // `glyph: true` renders "Ƀ" as the master's own vector (no font carries U+0243).
  items: [
    { id: 'rim', title: 'The rim.', text: 'Bronze, for the metal issues: the nickel and the gold.' },
    { id: 'field', title: 'The field.', text: 'Greenback green, for the paper issue and the century of notes that followed.' },
    { id: 'bison', title: 'The bison.', text: 'Drawn in the intaglio tradition of banknote engraving. Not a mascot. A specimen.' },
    { id: 'guilloche', title: 'The guilloche.', text: 'The security pattern of paper money, redrawn as flowing, computed line. Engraving, as the future would draw it.' },
    { id: 'b', title: 'The Ƀ.', glyph: true, text: 'The project’s own B, struck through like a currency sign.' },
    { id: 'ground', title: 'The ground line.', text: 'BUFFALO in binary, framed in quantum ket notation. From a distance it reads as ground. Up close, it reads as a name.' },
  ],
  ketBytes: ['01000010', '01010101', '01000110', '01000110', '01000001', '01001100', '01001111'],
  ketLetters: ['B', 'U', 'F', 'F', 'A', 'L', 'O'],
  ketLabel: 'DECODE THE GROUND LINE',
  ketSr: 'Ket notation line, binary for BUFFALO.',
  principle: 'Read from afar, it is a line. Read up close, it is a message.',
};

export const SPEC = {
  label: 'VI · SPECIFICATION OF ISSUE',
  h2: 'Trust the page only when the chain agrees.',
  body: pick(
    'Before issue, every material field is marked pending on purpose. At issue, this section becomes the single source of the official serial and its links.',
    'This section is the single source of the official serial and its links. Confirm every field against the explorer.',
  ),
  noticeTitle: 'Counterfeit notice.',
  notice: pick(
    'The official mint address has yet to be published. Until it appears here and resolves on an explorer, any token presented as $BUFFALO is a counterfeit.',
    'Only the mint address below identifies the official $BUFFALO token. Any address that differs by even one character is a counterfeit.',
  ),
  verify: 'Verify on explorer',
  viewOnExplorer: 'View on explorer',
  rows: {
    denomination: 'Denomination',
    network: 'Network',
    issuance: 'Issuance',
    serial: 'Serial (mint address)',
    explorer: 'Explorer',
    totalSupply: 'Total supply',
    mintAuthority: 'Mint authority',
    freezeAuthority: 'Freeze authority',
    teamAllocation: 'Team allocation',
    status: 'Status',
  },
  rules: [
    { title: 'Inspect the serial.', text: 'Match every character, not just the first and last four. Counterfeits are built to pass a glance.' },
    { title: 'Ignore private messages.', text: 'No one representing BUFFALO will ever ask for a seed phrase, a private key, or a private sale.' },
    { title: 'Expect no promises.', text: 'No post, message or account can guarantee price, liquidity or returns. Anyone who does is not speaking for BUFFALO.' },
  ],
  wit: 'Conviction is not a substitute for inspection.',
};

export const ACQUIRE = {
  label: 'VII · ACQUISITION',
  h2: pick('How to acquire the Fourth Issue, once it is struck.', 'How to acquire the Fourth Issue.'),
  intro: pick(
    'These steps become actionable only after the serial and the official route are published in the Specification.',
    'Use only the serial and the route published in the Specification.',
  ),
  steps: [
    { title: 'Open a Solana wallet.', text: 'Fund it with SOL, and only with an amount you can afford to lose entirely.' },
    { title: 'Copy the serial from this page.', text: 'Then confirm the same address on the explorer linked in the Specification.', wit: 'Measure twice. Sign once.' },
    { title: 'Use the official route.', text: 'Open the pump.fun or DEX link published here. Avoid search ads, sponsored results and links sent to you.' },
    { title: 'Review before you sign.', text: 'Check slippage, price impact and the token address inside the transaction itself before approving.' },
  ],
  secondary: 'Review the specification',
  note: pick(
    '$BUFFALO has not been issued. This site will never ask you to connect a wallet, send funds, or share a recovery phrase.',
    'This site will never ask you to connect a wallet or share a recovery phrase. Every transaction happens in your own wallet, under your own review.',
  ),
  noteWit: 'Buffalo are resilient. Incorrect transactions are not.',
};

export const CUSTODIANS = {
  label: 'VIII · THE CUSTODIANS',
  h2: 'The symbol was never owned. It was carried.',
  body: 'Every era that issued the bison carried it forward. $BUFFALO is carried the same way: by Custodians, in every time zone.',
  x: 'Official X',
  chat: 'Custodian chat',
  opensAtIssue: 'Opens at issue',
  channelsNote: 'Official channels appear here first. Anything not linked from this page is not official.',
  codeTitle: 'The Custodian Code',
  code: [
    { n: 'I.', text: 'Verify before you share. A fast counterfeit is still a counterfeit.' },
    { n: 'II.', text: 'No manufactured urgency. No private sales. No promises.' },
    { n: 'III.', text: 'Carry the mark unaltered. The symbol has outlived every market it has appeared in.' },
  ],
  codeWit: 'Red candles do not qualify as an extinction event.',
  kitTitle: 'The Custodian Kit',
  kitH3: 'Carry the mark.',
  usage: 'Use the mark as issued. Do not redraw, recolor, crop or add to it.',
};

export const FINAL = {
  label: 'THE FOURTH ISSUE',
  display: pick('The Fourth Issue is being struck.', 'The Fourth Issue is in circulation.'),
  sub: pick(
    'At issue, the official mint address, the explorer link and the acquisition route will appear on this page.',
    'The official mint address, the explorer link and the acquisition route are published on this page. Verify before you move.',
  ),
  spec: 'Check the specification',
  provenance: 'Read the provenance',
  wit: 'Past performance includes surviving the Ice Age.',
};

export const FOOTER = {
  tagline: '$BUFFALO · The Fourth Issue',
  links: [
    { href: '/#provenance', label: 'Provenance' },
    { href: '/#character', label: 'Character' },
    { href: '/#mark', label: 'The Mark' },
    { href: '/#specification', label: 'Specification' },
    { href: '/#acquire', label: 'Acquire' },
    { href: '/#custodians', label: 'Custodians' },
    { href: '/disclaimer', label: 'Disclaimer' },
  ],
  disclaimer: [
    '$BUFFALO is a memecoin and a cultural token. It makes no promise of returns, utility, price appreciation, liquidity or protection from loss. Digital assets carry substantial risk, including the total loss of funds. Nothing on this site is financial, legal or tax advice.',
    'BUFFALO is an independent project. It is not affiliated with, endorsed by or issued by the United States Mint, the U.S. Department of the Treasury, the Bureau of Engraving and Printing, or any government. $BUFFALO is not legal tender. Historical images are credited to their sources and shown for historical reference.',
  ],
  disclaimerWit: 'Historically significant. Financially unserious in the legally appropriate places.',
  disclaimerTail: 'You are responsible for the laws that apply where you live.',
  bottom: 'Paper. Nickel. Gold. Now, everywhere.',
};

export const NOT_FOUND = {
  label: 'NOT IN CIRCULATION',
  h1: 'This note is not in circulation.',
  body: 'The page you requested was never issued, or has been withdrawn.',
  button: 'Return to the Fourth Issue',
};

export const META = {
  title: 'BUFFALO ($BUFFALO) · Paper. Nickel. Gold. Blockchain.',
  description:
    'Paper. Nickel. Gold. Blockchain. For more than a century, the bison has marked American money. $BUFFALO is an independent Solana memecoin inspired by that history.',
  coinAlt:
    'BUFFALO emblem: an engraved bison on a green guilloche field within a bronze rim, overlaid by a struck letter B with a currency stroke.',
};
