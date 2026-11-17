// Final copy (brief §5). Do not paraphrase, add hype, exclamation marks or emoji.
// Paired [PRE]/[LIVE] strings are resolved at build time via pick(); only the
// active state's string is emitted to HTML.
//
// Typography: straight apostrophes from the brief are set as typographic
// apostrophes (’). Nothing else differs from the brief. The copy test
// normalizes ’ → ' when comparing against the brief.
import { issue, pick } from '../lib/issue-state';

export const CORE_LINE = 'The bison has been American money three times. Now it belongs to no nation.';

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
  lead: 'The bison has been American money three times.',
  h1: 'Now it belongs to no nation.',
  body: 'Paper in 1901. The nickel in 1913. Gold in 2006. $BUFFALO is the fourth issue: struck on Solana, held anywhere, bounded by nothing.',
  secondary: 'Read the provenance',
  serialLabel: 'SERIAL · CONTRACT ADDRESS',
  serialPending: 'To be struck at issue',
  note: 'Only this page and the official X account publish the serial. Verify it before every transaction.',
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
    'A nation put it on its money to borrow that character. On paper in 1901. On the nickel in 1913. In gold in 2006.',
    'For more than a century, its power had borders.',
    'On the chain, the borders are gone. No treasury. No jurisdiction. No edge of the map.',
    'Paper. Nickel. Gold. Now, everywhere.',
  ],
  signature: 'BUFFALO — THE FOURTH ISSUE',
};

export const PROVENANCE = {
  label: 'II · PROVENANCE',
  h2: 'Three issues. Every one of them bounded by a border.',
  intro: 'The same symbol, carried by a nation through paper, metal and gold. Each issue traveled only as far as the nation that issued it.',
  cards: [
    {
      label: 'SERIES 1901 · ISSUE I · PAPER',
      title: 'The bison enters American money.',
      body: 'The ten-dollar United States Note of 1901 places a bison at the center of the design, flanked by portraits of Meriwether Lewis and William Clark. Collectors still call it the Bison Note.',
      wit: 'Legal tender. Border included.',
      caption: '1901 United States Note, $10. Public-domain reproduction via Wikimedia Commons.',
    },
    {
      label: 'SERIES 1913 · ISSUE II · NICKEL',
      title: 'The symbol goes into every pocket.',
      body: 'James Earle Fraser’s Buffalo nickel carries the bison into everyday circulation from 1913 to 1938. It stops being pictured as value and starts moving as value.',
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
      title: 'The symbol leaves the jurisdiction.',
      body: '$BUFFALO is struck on Solana. It can be held in any wallet, in any country, at any hour. For the first time, the bison answers to no treasury.',
      wit: 'Borders not included.',
      caption: pick(
        'Pre-issue. The serial will appear only in the Specification on this page.',
        'In circulation. Verify the serial in the Specification on this page.',
      ),
    },
  ],
};

export const CHARACTER = {
  label: 'III · CHARACTER',
  h2: 'A force of nature belongs to no nation.',
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
    { id: 'b', title: 'The Ƀ.', glyph: true, text: 'A B struck through like a currency sign. A letter that became a denomination.' },
    { id: 'ground', title: 'The ground line.', text: 'BUFFALO in binary, written in the ket notation used for quantum states. From a distance it reads as ground. Up close, it reads as a name.' },
  ],
  ketBytes: ['01000010', '01010101', '01000110', '01000110', '01000001', '01001100', '01001111'],
  ketLetters: ['B', 'U', 'F', 'F', 'A', 'L', 'O'],
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
    'Until a serial appears here and resolves on an explorer, any token presented as $BUFFALO is a counterfeit.',
    'Any address that differs from the serial below by even one character is a counterfeit.',
  ),
  verify: 'Verify on explorer',
  viewOnExplorer: 'View on explorer',
  rows: {
    denomination: 'Denomination',
    network: 'Network',
    issuance: 'Issuance',
    serial: 'Serial (contract)',
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
};

export const CUSTODIANS = {
  label: 'VIII · THE CUSTODIANS',
  h2: 'The symbol was never owned. It was carried.',
  body: 'No nation that printed the bison ever owned what it stood for. $BUFFALO is held the same way: by Custodians, in every time zone, carrying the symbol forward.',
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
  kitTitle: 'The Custodian Kit',
  kitH3: 'Carry the mark.',
  usage: 'Use the mark as issued. Do not redraw, recolor, crop or add to it.',
};

export const FINAL = {
  label: 'THE FOURTH ISSUE',
  display: pick('The Fourth Issue is being struck.', 'The Fourth Issue is in circulation.'),
  sub: pick(
    'When it is issued, the serial, the explorer, the acquisition route and the official channels will appear on this page, together, at the same moment.',
    'The serial, the explorer, the acquisition route and the official channels are published on this page, together. Verify before you move.',
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
  disclaimerWit: 'The symbol has no jurisdiction. You still do.',
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
  title: 'BUFFALO ($BUFFALO) · The Fourth Issue',
  description:
    'The bison has been American money three times. Now it belongs to no nation. Paper, nickel, gold, and now the chain. $BUFFALO, the Fourth Issue, on Solana.',
  coinAlt:
    'BUFFALO emblem: an engraved bison on a green guilloche field within a bronze rim, overlaid by a struck letter B with a currency stroke.',
};
