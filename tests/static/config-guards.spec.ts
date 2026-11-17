// §13.3 Config guards. The site must be incapable of showing a live state by accident.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, walk, BASE58_RUN, LIVE_CONTRACT } from '../helpers';
// @ts-expect-error — plain ESM module shared with the build
import { deriveIssue } from '../../src/lib/validate-issue.mjs';
import { ISSUE } from '../../src/config/issue';

const html = (dist: string, page = 'index.html') => fs.readFileSync(path.join(ROOT, dist, page), 'utf8');

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

  test('explorer override without the exact contract fails the build', () => {
    const r = build('tests/fixtures/issue/bad-explorer.ts');
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('explorerUrl must contain the exact contractAddress');
  });

  test('fixtures are refused in Vercel builds', () => {
    const r = build('tests/fixtures/issue/live.ts', { VERCEL: '1' });
    expect(r.status).not.toBe(0);
    expect(r.output).toContain('not allowed in Vercel builds');
  });

  test('empty explorer/buy derive Solscan and pump.fun URLs with the exact contract', () => {
    const r = build('tests/fixtures/issue/live-derived.ts');
    expect(r.status, r.output).toBe(0);
    const h = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
    expect(h).toContain(`https://solscan.io/token/${LIVE_CONTRACT}`);
    expect(h).toContain(`https://pump.fun/coin/${LIVE_CONTRACT}`);
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
    bad({ status: 'live', contractAddress: LIVE_CONTRACT, buyUrl: 'https://pump-fun.io/coin/x' }, /allowlist/);
    bad({ xUrl: 'https://x.co/buffalo' }, /allowlist/);
    bad({ telegramUrl: 'https://t.me.evil.com/x' }, /allowlist/);
    bad({ siteUrl: 'https://buffalocoin.xyz/' }, /origin only/);
    bad({ siteUrl: 'http://buffalocoin.xyz' }, /https/);
    bad({ explorerUrl: 'https://solscan.io/token/x' }, /exact contractAddress/);
    bad({ issueDate: 'next week' }, /ISO date/);
    bad({ network: 'Ethereum' }, /fixed/);
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
