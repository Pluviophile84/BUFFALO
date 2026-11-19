// Build-time validation + derivation for the issue config.
// Plain ESM (no TS) so astro.config.mjs, build scripts and the site share one
// implementation. Throws on any violation: the build fails, nothing deploys.

// Socials are pinned to their platforms so a typo-squatted link cannot ship.
export const X_HOSTS = Object.freeze(['x.com', 'twitter.com']);
export const TELEGRAM_HOSTS = Object.freeze(['t.me', 'telegram.me']);

// First gate: the base58 alphabet and a Solana address's length range.
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const FIXED = { network: 'Solana', platform: 'pump.fun' };

/** Base58 (Bitcoin alphabet) → bytes, or null for a character outside the alphabet. */
export function base58Decode(s) {
  let n = 0n;
  for (const c of s) {
    const i = ALPHABET.indexOf(c);
    if (i < 0) return null;
    n = n * 58n + BigInt(i);
  }
  const out = [];
  for (; n > 0n; n >>= 8n) out.push(Number(n & 0xffn));
  for (const c of s) {
    if (c !== '1') break;
    out.push(0); // each leading "1" is a leading zero byte
  }
  return Uint8Array.from(out.reverse());
}

/** A Solana public key: base58, 32–44 characters, decoding to exactly 32 bytes. */
export function isSolanaAddress(s) {
  return typeof s === 'string' && BASE58.test(s) && base58Decode(s)?.length === 32;
}

// ── Explorer and buy routes ───────────────────────────────────────────────────
// An override is accepted only when the mint sits in a defined place: the exact
// path segment (or, for Raydium, the outputMint parameter). Extending a list is a
// deliberate code edit here, with a test in tests/static/config-guards.spec.ts.
const segs = (u) => u.pathname.split('/').slice(1); // '/token/x' → ['token', 'x']
const path = (u, ...parts) => {
  const s = segs(u);
  return s.length === parts.length && s.every((p, i) => p === parts[i]);
};
const bare = (u) => !u.search && !u.hash;
const params = (u) => [...u.searchParams.entries()];

export const EXPLORER_ROUTES = Object.freeze([
  { route: 'https://solscan.io/token/{mint}', host: 'solscan.io', test: (u, m) => path(u, 'token', m) && bare(u) },
  { route: 'https://explorer.solana.com/address/{mint}', host: 'explorer.solana.com', test: (u, m) => path(u, 'address', m) && bare(u) },
  { route: 'https://solana.fm/address/{mint}', host: 'solana.fm', test: (u, m) => path(u, 'address', m) && bare(u) },
  {
    route: 'https://birdeye.so/token/{mint} (optionally ?chain=solana)',
    host: 'birdeye.so',
    test: (u, m) => path(u, 'token', m) && !u.hash && (params(u).length === 0 || (params(u).length === 1 && u.searchParams.get('chain') === 'solana')),
  },
]);

export const BUY_ROUTES = Object.freeze([
  { route: 'https://pump.fun/coin/{mint}', host: 'pump.fun', test: (u, m) => path(u, 'coin', m) && bare(u) },
  { route: 'https://jup.ag/swap/SOL-{mint}', host: 'jup.ag', test: (u, m) => path(u, 'swap', `SOL-${m}`) && bare(u) },
  {
    route: 'https://raydium.io/swap/?…outputMint={mint}',
    host: 'raydium.io',
    test: (u, m) => (path(u, 'swap', '') || path(u, 'swap')) && !u.hash && u.searchParams.getAll('outputMint').length === 1 && u.searchParams.get('outputMint') === m,
  },
]);

/** True when `url` is one of `routes` for `mint`: exact host, no port, the mint in its place. */
export function matchesRoute(url, mint, routes) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.port || u.username || u.password) return false;
  return routes.some((r) => u.hostname === r.host && r.test(u, mint));
}

export class IssueConfigError extends Error {
  constructor(problems) {
    super(
      `\n\n  BUFFALO issue config is invalid (src/config/issue.ts):\n${problems.map((p) => `   • ${p}`).join('\n')}\n\n  The build was stopped so a wrong page cannot ship.\n`,
    );
    this.name = 'IssueConfigError';
    this.problems = problems;
  }
}

function parseHttps(value, field, problems) {
  let u;
  try {
    u = new URL(value);
  } catch {
    problems.push(`${field} is not a valid URL: "${value}"`);
    return null;
  }
  if (u.protocol !== 'https:') problems.push(`${field} must use https: "${value}"`);
  if (u.username || u.password) problems.push(`${field} must not contain credentials`);
  return u;
}

function checkHost(u, field, allow, problems) {
  if (u && !allow.includes(u.hostname)) {
    problems.push(`${field} host "${u.hostname}" is not on the allowlist (${allow.join(', ')}). Extending it is a deliberate code edit in src/lib/validate-issue.mjs.`);
  }
}

function checkRoute(value, field, list, listName, mint, problems, note = '') {
  if (!parseHttps(value, field, problems)) return;
  if (matchesRoute(value, mint, list)) return;
  problems.push(
    `${field} must be one of these routes, with the mint address exactly in place of {mint}: ${list.map((r) => r.route).join(' · ')}.${note} Got "${value}". ` +
      `To accept another route, add it to ${listName} in src/lib/validate-issue.mjs (a deliberate code edit) with a test in tests/static/config-guards.spec.ts.`,
  );
}

/** A real calendar date written YYYY-MM-DD (rejects 2026-02-30, 2026-13-01, 2026-2-3). */
export function isCalendarDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

export function shortSerial(address) {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function formatIssueDate(iso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Validate the raw config and derive everything the page renders.
 * @param {import('../config/issue').IssueConfig} cfg
 */
export function deriveIssue(cfg) {
  const problems = [];
  const str = (k) => (typeof cfg[k] === 'string' ? cfg[k].trim() : '');

  if (cfg.status !== 'pre-issue' && cfg.status !== 'live') problems.push(`status must be 'pre-issue' or 'live' (got "${cfg.status}")`);
  const live = cfg.status === 'live';

  if (!Number.isInteger(cfg.seriesYear) || cfg.seriesYear < 2000 || cfg.seriesYear > 2100) problems.push('seriesYear must be a four-digit year');
  for (const [k, v] of Object.entries(FIXED)) if (cfg[k] !== v) problems.push(`${k} is fixed to "${v}"`);

  // The serial: the character/length gate first, then a real 32-byte public key.
  const contract = str('contractAddress');
  if (contract && !BASE58.test(contract)) problems.push(`contractAddress must be base58 and 32–44 characters (got ${contract.length} characters)`);
  else if (contract && !isSolanaAddress(contract))
    problems.push(`contractAddress is not a Solana address: it decodes to ${base58Decode(contract).length} bytes, not 32. Copy the mint address again from the explorer.`);
  if (cfg.contractAddress && cfg.contractAddress !== contract) problems.push('contractAddress has leading/trailing whitespace');
  if (live && !contract) problems.push("status is 'live' but contractAddress is empty. The serial is the one value required at issue.");

  // siteUrl
  const site = parseHttps(str('siteUrl'), 'siteUrl', problems);
  if (site && (site.pathname !== '/' || site.search || site.hash || str('siteUrl').endsWith('/'))) problems.push('siteUrl must be an origin only, with no path and no trailing slash');

  // explorer / buy: overrides on a defined route, or derived
  const explorerOverride = str('explorerUrl');
  const buyOverride = str('buyUrl');
  if (explorerOverride && !contract) problems.push('explorerUrl is set but contractAddress is empty');
  else if (explorerOverride) checkRoute(explorerOverride, 'explorerUrl', EXPLORER_ROUTES, 'EXPLORER_ROUTES', contract, problems, ' Pair and pool pages are not explorer links.');
  if (buyOverride && !contract) problems.push('buyUrl is set but contractAddress is empty');
  else if (buyOverride) checkRoute(buyOverride, 'buyUrl', BUY_ROUTES, 'BUY_ROUTES', contract, problems);
  const explorerUrl = explorerOverride || (contract ? `https://solscan.io/token/${contract}` : '');
  const buyUrl = buyOverride || (contract ? `https://pump.fun/coin/${contract}` : '');

  // socials (may go live before the contract)
  const xUrl = str('xUrl');
  const telegramUrl = str('telegramUrl');
  if (xUrl) checkHost(parseHttps(xUrl, 'xUrl', problems), 'xUrl', X_HOSTS, problems);
  if (telegramUrl) checkHost(parseHttps(telegramUrl, 'telegramUrl', problems), 'telegramUrl', TELEGRAM_HOSTS, problems);

  // issue date
  const issueDate = str('issueDate');
  if (issueDate && !isCalendarDate(issueDate)) problems.push(`issueDate must be a real calendar date written YYYY-MM-DD (got "${issueDate}")`);

  if (problems.length) throw new IssueConfigError(problems);

  const fact = (k, pre) => (live ? str(k) || 'Pending verification' : pre);
  const PENDING = 'Pending verification';

  return Object.freeze({
    live,
    status: cfg.status,
    statusLabel: live ? 'In circulation' : 'Pre-issue',
    seriesYear: cfg.seriesYear,
    network: FIXED.network,
    platform: FIXED.platform,
    siteUrl: site.origin,
    // The serial is only ever exposed in the live state.
    serial: live ? contract : null,
    serialShort: live ? shortSerial(contract) : null,
    explorerUrl: live ? explorerUrl : null,
    buyUrl: live ? buyUrl : null,
    xUrl: xUrl || null,
    telegramUrl: telegramUrl || null,
    issueDate: issueDate || null,
    issueDateLabel: issueDate ? formatIssueDate(issueDate) : 'To be announced',
    facts: {
      totalSupply: fact('totalSupply', 'Published at issue'),
      mintAuthority: fact('mintAuthority', 'Verified at issue'),
      freezeAuthority: fact('freezeAuthority', 'Verified at issue'),
      teamAllocation: fact('teamAllocation', 'Published at issue'),
    },
    pendingLabel: PENDING,
    // Staged-but-unissued contract: allowed, never rendered.
    stagedContract: !live && !!contract,
  });
}
