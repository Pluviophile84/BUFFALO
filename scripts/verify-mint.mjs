#!/usr/bin/env node
// npm run verify-mint — check the configured mint on Solana mainnet before launch.
//
//   - getAccountInfo (jsonParsed) for contractAddress;
//   - the owner must be the SPL Token or Token-2022 program, and the account a mint;
//   - prints decimals, supply, mint authority and freeze authority;
//   - fails if a published fact (totalSupply, mintAuthority, freezeAuthority), when
//     set, differs from the chain. Authorities compare as "Revoked" (none) or the
//     exact address.
//
// Not part of the Vercel build (an RPC hiccup must not block a deploy); CI runs it
// when status is 'live', and the README launch procedure requires it.
//
// Options:
//   --mint <address>  check another mint instead (a smoke test, e.g. USDC); the
//                     config's facts are not compared, since they describe $BUFFALO
//   SOLANA_RPC_URL    RPC endpoint (default https://api.mainnet-beta.solana.com)
// Also honours BUFFALO_ISSUE_FIXTURE outside Vercel, like the build.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadIssue } from '../src/lib/load-issue.mjs';
import { isSolanaAddress } from '../src/lib/validate-issue.mjs';
import { checkMint } from './lib/mint-check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const fail = (msg) => {
  console.error(`\n  verify-mint: ${msg}\n`);
  process.exit(1);
};

const i = process.argv.indexOf('--mint');
const override = i > 0 ? process.argv[i + 1] : null;
const { config, path: cfgPath } = await loadIssue(ROOT); // validates the config first
const mint = override ?? config.contractAddress;
if (!mint) fail(`contractAddress is empty in ${path.relative(ROOT, cfgPath)}. Set it (and status 'live') before verifying.`);
if (!isSolanaAddress(mint)) fail(`"${mint}" is not a Solana address.`);

async function rpc(method, params, attempt = 1) {
  try {
    const r = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j.error) throw new Error(`RPC error ${j.error.code}: ${j.error.message}`);
    return j.result;
  } catch (e) {
    if (attempt < 3) {
      await new Promise((res) => setTimeout(res, 1000 * attempt));
      return rpc(method, params, attempt + 1);
    }
    fail(`could not reach ${new URL(RPC).host}: ${e.message}`);
  }
}

const result = await rpc('getAccountInfo', [mint, { encoding: 'jsonParsed', commitment: 'finalized' }]);
const facts = override ? {} : { totalSupply: config.totalSupply, mintAuthority: config.mintAuthority, freezeAuthority: config.freezeAuthority };
const { ok, report, problems } = checkMint(mint, result?.value ?? null, facts);

console.log(`\n  Solana mainnet (${new URL(RPC).host}, slot ${result?.context?.slot ?? '?'})\n`);
for (const l of report) console.log(`  ${l}`);
if (override) console.log(`\n  (--mint: a smoke test; the config's published facts were not compared)`);
else if (!['totalSupply', 'mintAuthority', 'freezeAuthority'].some((k) => String(config[k] ?? '').trim())) console.log('\n  (no published facts set in the config: nothing to compare yet)');
if (!ok) {
  console.error(`\n  ✗ ${problems.length} problem${problems.length > 1 ? 's' : ''}:`);
  for (const p of problems) console.error(`    • ${p}`);
  console.error('');
  process.exit(1);
}
console.log('\n  ✓ the mint checks out\n');
