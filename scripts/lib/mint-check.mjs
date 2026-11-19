// Pure checks for scripts/verify-mint.mjs: what Solana mainnet reports for a mint
// account (getAccountInfo, jsonParsed) against the facts the config publishes.
// No network here, so tests can feed it recorded responses.
import { isSolanaAddress } from '../../src/lib/validate-issue.mjs';

export const TOKEN_PROGRAMS = Object.freeze({
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'SPL Token',
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: 'Token-2022',
});

/** Raw integer supply → decimal string at `decimals` (no rounding, no trailing zeros). */
export function formatUnits(raw, decimals) {
  const s = BigInt(raw).toString().padStart(decimals + 1, '0');
  const int = s.slice(0, s.length - decimals);
  const frac = decimals ? s.slice(-decimals).replace(/0+$/, '') : '';
  return frac ? `${int}.${frac}` : int;
}

/** A published supply ("1,000,000,000", "1 000 000 000", "1000000000.5") → canonical decimal, or null. */
export function normaliseAmount(text) {
  const t = String(text).trim().replace(/[,\s_]/g, '');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [i, f = ''] = t.split('.');
  const int = i.replace(/^0+(?=\d)/, '');
  const frac = f.replace(/0+$/, '');
  return frac ? `${int}.${frac}` : int;
}

/** A published authority: "Revoked" → null (no authority), an address → itself; anything else → undefined. */
export function normaliseAuthority(text) {
  const t = String(text).trim();
  if (/^revoked$/i.test(t)) return null;
  if (isSolanaAddress(t)) return t;
  return undefined;
}

/**
 * @param {string} mint the address that was queried
 * @param {any} value getAccountInfo(...).result.value (null when the account does not exist)
 * @param {{ totalSupply?: string, mintAuthority?: string, freezeAuthority?: string }} facts the config's published facts ('' = not set)
 * @returns {{ ok: boolean, report: string[], problems: string[] }}
 */
export function checkMint(mint, value, facts = {}) {
  const report = [];
  const problems = [];
  if (!value) return { ok: false, report, problems: [`No account exists at ${mint} on mainnet.`] };

  const program = TOKEN_PROGRAMS[value.owner];
  if (!program) problems.push(`The account is owned by ${value.owner}, not the SPL Token or Token-2022 program: it is not a token mint.`);
  const parsed = value.data && typeof value.data === 'object' && !Array.isArray(value.data) ? value.data.parsed : null;
  if (!parsed || parsed.type !== 'mint') {
    problems.push(`The account is not a mint (parsed type: ${parsed?.type ?? 'none'}).`);
    return { ok: false, report, problems };
  }
  const info = parsed.info;
  if (info.isInitialized === false) problems.push('The mint is not initialised.');

  const supply = formatUnits(info.supply, info.decimals);
  const show = (a) => (a === null ? 'none (revoked)' : a);
  report.push(
    `Mint             ${mint}`,
    `Program          ${program ?? value.owner}`,
    `Decimals         ${info.decimals}`,
    `Supply           ${supply} (raw ${info.supply})`,
    `Mint authority   ${show(info.mintAuthority ?? null)}`,
    `Freeze authority ${show(info.freezeAuthority ?? null)}`,
  );

  const set = (k) => typeof facts[k] === 'string' && facts[k].trim() !== '';
  if (set('totalSupply')) {
    const want = normaliseAmount(facts.totalSupply);
    if (want === null) problems.push(`totalSupply "${facts.totalSupply}" is not a number this script can compare.`);
    else if (want !== supply) problems.push(`totalSupply: the config says ${facts.totalSupply}, the chain says ${supply}.`);
    else report.push(`✓ totalSupply matches (${facts.totalSupply})`);
  }
  for (const k of ['mintAuthority', 'freezeAuthority']) {
    if (!set(k)) continue;
    const want = normaliseAuthority(facts[k]);
    const have = info[k] ?? null;
    if (want === undefined) problems.push(`${k} "${facts[k]}" must be "Revoked" or the exact authority address to be verified.`);
    else if (want !== have) problems.push(`${k}: the config says ${want === null ? 'Revoked' : want}, the chain says ${have === null ? 'revoked (none)' : have}.`);
    else report.push(`✓ ${k} matches (${facts[k]})`);
  }
  return { ok: problems.length === 0, report, problems };
}
