// §13.3 Config guards. The site must be incapable of showing a live state by accident.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, walk, BASE58_RUN, LIVE_CONTRACT } from '../helpers';
// @ts-expect-error — plain ESM module shared with the build
import { deriveIssue, isSolanaAddress, base58Decode, isCalendarDate } from '../../src/lib/validate-issue.mjs';
// @ts-expect-error — plain ESM module (scripts/verify-mint.mjs)
import { checkMint, formatUnits } from '../../scripts/lib/mint-check.mjs';
import { ISSUE } from '../../src/config/issue';

const OTHER = 'So11111111111111111111111111111111111111112'; // wrapped SOL: a real mint that is not ours
const html = (dist: string, page = 'index.html') => fs.readFileSync(path.join(ROOT, dist, page), 'utf8');
/** The Custodians head (channels and their note), from the section to the Code. */
const custodians = (h: string) => h.slice(h.indexOf('id="custodians"'), h.indexOf('class="code"', h.indexOf('id="custodians"')));

function build(fixture: string, extraEnv: Record<string, string> = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'buffalo-guard-'));
  const r = spawnSync('npm', ['run', 'build', '--silent'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', BUFFALO_ISSUE_FIXTURE: fixture, BUFFALO_OUT_DIR: out, ...extraEnv },
  });
  return { status: r.status, output: `${r.stdout}\n${r.stderr}`, out };
}

test.describe('shipped config (pre-issue)', () => {
  test('the shipped config is pre-issue with no serial', () => {
    expect(ISSUE.status).toBe('pre-issue');
    expect(ISSUE.contractAddress).toBe('');
  });

  test('no live links, no contract-shaped strings', () => {
    for (const f of walk(path.join(ROOT, 'dist'), (f) => f.endsWith('.html'))) {
      const h = fs.readFileSync(f, 'utf8');
      expect(h, f).not.toMatch(/href="https:\/\/(pump\.fun|solscan\.io|explorer\.solana\.com|solana\.fm|birdeye\.so|dexscreener\.com|jup\.ag|raydium\.io)/);
      expect(h.match(BASE58_RUN) ?? [], `contract-shaped string in ${f}`).toEqual([]);
      expect(h).not.toContain('data-serial>');
      expect(h).not.toContain('data-copy=');
    }
  });

  test('pre-issue channels are unchanged: both shown, disabled, "Opens at issue"', () => {
    const c = custodians(html('dist'));
    expect((c.match(/aria-disabled="true"/g) ?? []).length).toBe(2);
    expect((c.match(/Opens at issue/g) ?? []).length).toBe(2);
    expect(c).toContain('Official X');
    expect(c).toContain('Custodian chat');
    expect(c).not.toContain('data-no-channels');
  });

  test('stable per-instance helper ids: named by the caller, unique, each one referenced', () => {
    const action = fs.readFileSync(path.join(ROOT, 'src/components/Action.astro'), 'utf8');
    expect(action).not.toMatch(/globalThis|__actionSeq/);
    const h = html('dist');
    const ids = [...h.matchAll(/<span class="helper" id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.sort()).toEqual(['help-acquire-buy', 'help-custodians-chat', 'help-custodians-x', 'help-hero-acquire', 'help-menu-acquire', 'help-spec-acquire', 'help-spec-verify'].sort());
    for (const id of ids) expect(h, id).toContain(`aria-describedby="${id}"`);
  });

  test('disabled actions have no href; copy disabled; specimen present', () => {
    const h = html('dist');
    const disabled = [...h.matchAll(/<a[^>]*aria-disabled="true"[^>]*>/g)].map((m) => m[0]);
    expect(disabled.length).toBeGreaterThanOrEqual(5);
    for (const a of disabled) expect(a).not.toMatch(/\shref=/);
    expect(h).toContain('Available at issue');
    const copies = [...h.matchAll(/<button class="serial__copy"[^>]*>/g)].map((m) => m[0]);
    expect(copies).toHaveLength(2);
    for (const b of copies) expect(b).toMatch(/\sdisabled/);
    expect((h.match(/data-specimen/g) ?? []).length).toBe(3); // 2 overprints + 1 stamp
    expect(h).toContain('To be struck at issue');
    expect(h).not.toContain('In circulation');
  });
});

test.describe('live fixture', () => {
  test('every serial instance renders from the single config value', () => {
    const h = html('dist-live');
    const serials = [...h.matchAll(/data-serial>([^<]*)</g)].map((m) => m[1]);
    expect(serials.length).toBeGreaterThanOrEqual(3);
    for (const s of serials) expect(s).toBe(LIVE_CONTRACT);
    const copies = [...h.matchAll(/data-copy="([^"]*)"/g)].map((m) => m[1]);
    expect(copies.length).toBeGreaterThanOrEqual(3);
    for (const c of copies) expect(c).toBe(LIVE_CONTRACT);
    // any contract-shaped string must be the contract itself
    for (const m of h.match(BASE58_RUN) ?? []) expect(LIVE_CONTRACT).toContain(m);
  });

  test('live channels: an unset channel has no button and never says "Opens at issue"', () => {
    const c = custodians(html('dist-live')); // the live fixture sets xUrl only
    expect(c).not.toContain('Opens at issue');
    expect(c).not.toContain('aria-disabled');
    expect(c).toMatch(/<a class="btn" href="https:\/\/x\.com\/example" target="_blank" rel="noopener noreferrer" data-external>\s*Official X\s*<\/a>/);
    expect(c).not.toContain('Custodian chat');
    expect(c).not.toContain('data-no-channels'); // one channel is set
  });

  test('specimen marks removed; live strings present', () => {
    const h = html('dist-live');
    expect(h).not.toContain('data-specimen');
    expect(h).not.toContain('SPECIMEN');
    expect(h).toContain('In circulation');
    expect(h).toContain('The Fourth Issue is in circulation.');
    expect(h).not.toContain('Issue pending');
    expect(h).toContain(`href="https://solscan.io/token/${LIVE_CONTRACT}"`);
    expect(h).toContain(`href="https://pump.fun/coin/${LIVE_CONTRACT}"`);
    // unset facts are never blank and never guessed
    expect(h).toContain('Pending verification');
  });
});

test.describe('builds that must fail', () => {
  test.describe.configure({ mode: 'serial' });

  test("status:'live' without a contract fails the build", () => {
    const r = build('tests/fixtures/issue/live-no-contract.ts');
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('contractAddress is empty');
  });

  test('an explorer override naming another mint fails the build', () => {
    const r = build('tests/fixtures/issue/bad-explorer.ts');
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('explorerUrl must be one of these routes');
  });

  test('a buy override off the defined routes fails the build, saying how to extend the list', () => {
    const r = build('tests/fixtures/issue/bad-buy.ts');
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('buyUrl must be one of these routes');
    expect(r.output).toContain('add it to BUY_ROUTES in src/lib/validate-issue.mjs');
  });

  test('one config source: the site URL comes from the config through deriveIssue()', () => {
    const conf = fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf8');
    expect(conf).toContain('loadIssue(root)');
    expect(conf).not.toMatch(/src\/config\/issue\.ts|siteMatch|siteUrl:\\s/); // no regex over the TypeScript source
    const r = build('tests/fixtures/issue/site-url.ts');
    expect(r.status, r.output).toBe(0);
    const h = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
    expect(h).toContain('<link rel="canonical" href="https://fixture.example.org"');
    expect(h).toContain('content="https://fixture.example.org/og/');
    const sitemap = fs.readdirSync(r.out).filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((f) => fs.readFileSync(path.join(r.out, f), 'utf8')).join('');
    expect(sitemap).toContain('<loc>https://fixture.example.org</loc>');
    fs.rmSync(r.out, { recursive: true, force: true });
  });

  test('fixtures are refused in Vercel builds', () => {
    const r = build('tests/fixtures/issue/live.ts', { VERCEL: '1' });
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('not allowed in Vercel builds');
  });

  test('empty explorer/buy derive Solscan and pump.fun URLs with the exact contract; no channel set → one line', () => {
    const r = build('tests/fixtures/issue/live-derived.ts');
    expect(r.status, r.output).toBe(0);
    const h = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
    expect(h).toContain(`https://solscan.io/token/${LIVE_CONTRACT}`);
    expect(h).toContain(`https://pump.fun/coin/${LIVE_CONTRACT}`);
    // live, neither channel set: no dead buttons, one line instead
    const c = custodians(h);
    expect(c).not.toContain('Opens at issue');
    expect(c).not.toContain('custodians__channels');
    expect(c).not.toMatch(/Official X|Custodian chat/);
    expect(c).toMatch(/<p class="custodians__none"[^>]*data-no-channels[^>]*>No official chat channel has been published\.<\/p>/);
    fs.rmSync(r.out, { recursive: true, force: true });
  });
});

test.describe('validator rules', () => {
  const base = { ...ISSUE };
  const bad = (patch: Record<string, unknown>, msg: RegExp) => expect(() => deriveIssue({ ...base, ...patch })).toThrow(msg);
  test('rejects malformed values', () => {
    bad({ status: 'launched' }, /status must be/);
    bad({ contractAddress: '0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl' }, /base58/);
    bad({ contractAddress: 'abc' }, /base58/);
    bad({ status: 'live', contractAddress: LIVE_CONTRACT, buyUrl: 'http://pump.fun/coin/x' }, /https/);
    bad({ status: 'live', contractAddress: LIVE_CONTRACT, buyUrl: 'https://pump-fun.io/coin/x' }, /buyUrl must be one of these routes/);
    bad({ xUrl: 'https://x.co/buffalo' }, /allowlist/);
    bad({ telegramUrl: 'https://t.me.evil.com/x' }, /allowlist/);
    bad({ siteUrl: 'https://buffalocoin.xyz/' }, /origin only/);
    bad({ siteUrl: 'http://buffalocoin.xyz' }, /https/);
    bad({ explorerUrl: 'https://solscan.io/token/x' }, /explorerUrl is set but contractAddress is empty/);
    bad({ buyUrl: 'https://pump.fun/coin/x' }, /buyUrl is set but contractAddress is empty/);
    bad({ issueDate: 'next week' }, /real calendar date/);
    bad({ network: 'Ethereum' }, /fixed/);
  });
  test('the mint is a real Solana public key: base58 decoding to exactly 32 bytes', () => {
    const good = [
      LIVE_CONTRACT, // 43 characters
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC, 44
      'So11111111111111111111111111111111111111112', // wrapped SOL, 43
      '11111111111111111111111111111111', // the System Program (all zero bytes), 32
    ];
    for (const a of good) {
      expect(isSolanaAddress(a), a).toBe(true);
      expect(() => deriveIssue({ ...base, status: 'live', contractAddress: a })).not.toThrow();
    }
    // pass the character/length gate (base58, 32–44 characters) but are not 32 bytes
    const wrong = [
      'TestFixtureMint7pQ2rS9vWxYz3aBcDeFgHjKmNpump', // the old fixture: 33 bytes
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', // 44 × z: 33 bytes
      '22222222222222222222222222222222', // 32 characters, 24 bytes
      '1111111111111111111111111111111112', // 34 characters, 34 bytes (33 leading zeros + 1)
    ];
    for (const a of wrong) {
      expect(a).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      expect(base58Decode(a)!.length, a).not.toBe(32);
      expect(isSolanaAddress(a), a).toBe(false);
      bad({ status: 'live', contractAddress: a }, /decodes to \d+ bytes, not 32/);
    }
    // the first gate still applies
    bad({ contractAddress: '0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl' }, /base58 and 32–44 characters/);
    bad({ contractAddress: '1'.repeat(45) }, /base58 and 32–44 characters/);
  });

  const M = LIVE_CONTRACT;
  const live = (patch: Record<string, unknown>) => deriveIssue({ ...base, status: 'live', contractAddress: M, ...patch });

  test('explorer override: each defined route is accepted, the mint as the exact path segment', () => {
    for (const u of [`https://solscan.io/token/${M}`, `https://explorer.solana.com/address/${M}`, `https://solana.fm/address/${M}`, `https://birdeye.so/token/${M}`, `https://birdeye.so/token/${M}?chain=solana`])
      expect(live({ explorerUrl: u }).explorerUrl, u).toBe(u);
  });

  test('explorer override: substring tricks, other mints, other routes, pair pages and look-alike hosts fail', () => {
    for (const u of [
      `https://solscan.io/token/${OTHER}?ref=${M}`, // the mint only in the query
      `https://solscan.io/token/${OTHER}#${M}`, // … or the fragment
      `https://solscan.io/token/${OTHER}/${M}`, // … or a later segment
      `https://solscan.io/token/${M}/holders`, // an extra segment
      `https://solscan.io/token/x${M}`, // the mint inside a longer segment
      `https://solscan.io/token/${M}?cluster=devnet`, // another network
      `https://explorer.solana.com/address/${M}?cluster=devnet`,
      `https://solscan.io/account/${M}`, // another route on an allowed host
      `https://birdeye.so/token/${M}?chain=ethereum`,
      `https://birdeye.so/token/${M}?chain=solana&ref=x`,
      `https://dexscreener.com/solana/${M}`, // a pair page
      `https://birdeye.so/pair/${M}?chain=solana`, // a pair page on an explorer host
      `https://raydium.io/liquidity-pools/?token=${M}`, // a pool page
      `https://pump.fun/coin/${M}`, // a buy route is not an explorer
      `https://evil.example/solscan.io/token/${M}`,
      `https://solscan.io.evil.example/token/${M}`,
      `https://www.solscan.io/token/${M}`,
      `https://solscan.io:8443/token/${M}`,
    ])
      expect(() => live({ explorerUrl: u }), u).toThrow(/explorerUrl must be one of these routes.*Pair and pool pages are not explorer links/s);
  });

  test('buy override: each defined route is accepted', () => {
    for (const u of [`https://pump.fun/coin/${M}`, `https://jup.ag/swap/SOL-${M}`, `https://raydium.io/swap/?inputMint=sol&outputMint=${M}`, `https://raydium.io/swap/?outputMint=${M}`])
      expect(live({ buyUrl: u }).buyUrl, u).toBe(u);
  });

  test('buy override: any other route fails, with how to extend the list', () => {
    for (const u of [
      `https://pump.fun/coin/${OTHER}?ref=${M}`,
      `https://pump.fun/coin/${M}/trade`,
      `https://pump.fun/${M}`,
      `https://jup.ag/swap/${M}-SOL`,
      `https://jup.ag/swap/SOL-${OTHER}?outputMint=${M}`,
      `https://raydium.io/swap/?inputMint=${M}&outputMint=${OTHER}`, // the mint as the input, not the output
      `https://raydium.io/swap/?outputMint=${M}&outputMint=${OTHER}`, // ambiguous
      `https://raydium.io/swap/#outputMint=${M}`,
      `https://raydium.io/liquidity/?outputMint=${M}`,
      `https://dexscreener.com/solana/${M}`,
      `https://solscan.io/token/${M}`, // an explorer is not a buy route
    ])
      expect(() => live({ buyUrl: u }), u).toThrow(/buyUrl must be one of these routes.*add it to BUY_ROUTES in src\/lib\/validate-issue\.mjs/s);
  });

  test('issueDate is a real calendar date written YYYY-MM-DD', () => {
    for (const d of ['2026-12-01', '2028-02-29', '2026-01-31']) {
      expect(isCalendarDate(d), d).toBe(true);
      expect(deriveIssue({ ...base, issueDate: d }).issueDate).toBe(d);
    }
    for (const d of ['2026-02-30', '2027-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-12-00', '2026-2-3', '2026-12-01T00:00:00Z', '01/12/2026', 'next week'])
      bad({ issueDate: d }, /issueDate must be a real calendar date written YYYY-MM-DD/);
  });

  test('pre-issue with a staged contract never exposes it', () => {
    const s = deriveIssue({ ...base, contractAddress: LIVE_CONTRACT });
    expect(s.serial).toBeNull();
    expect(s.buyUrl).toBeNull();
    expect(s.explorerUrl).toBeNull();
  });
  test('live derives links and pending facts', () => {
    const s = deriveIssue({ ...base, status: 'live', contractAddress: LIVE_CONTRACT });
    expect(s.explorerUrl).toBe(`https://solscan.io/token/${LIVE_CONTRACT}`);
    expect(s.buyUrl).toBe(`https://pump.fun/coin/${LIVE_CONTRACT}`);
    expect(s.facts.totalSupply).toBe('Pending verification');
    expect(s.serialShort).toBe('TestFi…Npump'.replace('Npump', LIVE_CONTRACT.slice(-6)));
  });
});

// npm run verify-mint (scripts/verify-mint.mjs): the checks, against recorded mainnet
// responses, so this suite never depends on an RPC endpoint.
test.describe('verify-mint checks', () => {
  const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const mintAccount = (info: Record<string, unknown>, owner = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') => ({
    owner,
    data: { program: 'spl-token', parsed: { type: 'mint', info: { decimals: 6, supply: '1000000000000000', isInitialized: true, mintAuthority: null, freezeAuthority: null, ...info } } },
  });

  test('a revoked-authority mint matches published facts', () => {
    const r = checkMint(USDC, mintAccount({}), { totalSupply: '1,000,000,000', mintAuthority: 'Revoked', freezeAuthority: 'revoked' });
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.report.join('\n')).toMatch(/Decimals +6/);
    expect(r.report.join('\n')).toMatch(/Supply +1000000000 \(raw 1000000000000000\)/);
    expect(r.report.join('\n')).toMatch(/Mint authority +none \(revoked\)/);
  });

  test('Token-2022 mints are accepted; unset facts are not compared', () => {
    const r = checkMint(USDC, mintAccount({ mintAuthority: OTHER }, 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), { totalSupply: '', mintAuthority: '', freezeAuthority: '' });
    expect(r.ok).toBe(true);
    expect(r.report.join('\n')).toContain('Token-2022');
  });

  test('mismatches fail: supply, an authority still set, a different authority, an unverifiable value', () => {
    const r = checkMint(USDC, mintAccount({ mintAuthority: OTHER, freezeAuthority: OTHER }), { totalSupply: '999,999,999', mintAuthority: 'Revoked', freezeAuthority: USDC });
    expect(r.ok).toBe(false);
    expect(r.problems.join('\n')).toMatch(/totalSupply: the config says 999,999,999, the chain says 1000000000/);
    expect(r.problems.join('\n')).toMatch(/mintAuthority: the config says Revoked, the chain says So111/);
    expect(r.problems.join('\n')).toMatch(/freezeAuthority: the config says EPjF.*, the chain says So111/);
    const vague = checkMint(USDC, mintAccount({}), { mintAuthority: 'Renounced by the team' });
    expect(vague.problems.join('\n')).toMatch(/must be "Revoked" or the exact authority address/);
  });

  test('not a token mint: missing account, another owner, a token account', () => {
    expect(checkMint(USDC, null).problems.join()).toMatch(/No account exists/);
    expect(checkMint(USDC, mintAccount({}, '11111111111111111111111111111111')).problems.join()).toMatch(/not the SPL Token or Token-2022 program/);
    const tokenAccount = { owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data: { program: 'spl-token', parsed: { type: 'account', info: {} } } };
    expect(checkMint(USDC, tokenAccount).problems.join()).toMatch(/not a mint \(parsed type: account\)/);
  });

  test('supply formatting keeps every digit', () => {
    expect(formatUnits('7700490623666371', 6)).toBe('7700490623.666371');
    expect(formatUnits('5', 9)).toBe('0.000000005');
    expect(formatUnits('1000000000000000000', 9)).toBe('1000000000');
    expect(formatUnits('42', 0)).toBe('42');
  });
});
