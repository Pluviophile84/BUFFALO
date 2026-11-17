// ─────────────────────────────────────────────────────────────────────────────
//  THE ONLY FILE EDITED AT LAUNCH.
//
//  To issue: set status to 'live' and paste the contract address. The explorer
//  (Solscan) and acquisition (pump.fun) links derive from the address. Every
//  value is validated at build time; an invalid value fails the build instead
//  of publishing a wrong page. See README → Launch procedure.
// ─────────────────────────────────────────────────────────────────────────────

export const ISSUE = {
  status: 'pre-issue' as 'pre-issue' | 'live',
  seriesYear: 2026, // shown as "SERIES 2026"; confirm before launch
  contractAddress: '', // the serial — THE ONLY VALUE REQUIRED AT LAUNCH
  explorerUrl: '', // optional override; default derived: https://solscan.io/token/{contractAddress}
  buyUrl: '', // optional override; default derived: https://pump.fun/coin/{contractAddress}
  xUrl: '',
  telegramUrl: '',
  siteUrl: 'https://buffalocoin.xyz', // official domain (registered); used for canonical/OG/sitemap
  issueDate: '', // optional ISO date, e.g. '2026-12-01'; shown as "Issue date" (no countdown)
  network: 'Solana',
  platform: 'pump.fun',
  totalSupply: '',
  mintAuthority: '',
  freezeAuthority: '',
  teamAllocation: '',
} as const;

export type IssueConfig = {
  status: 'pre-issue' | 'live';
  seriesYear: number;
  contractAddress: string;
  explorerUrl: string;
  buyUrl: string;
  xUrl: string;
  telegramUrl: string;
  siteUrl: string;
  issueDate: string;
  network: string;
  platform: string;
  totalSupply: string;
  mintAuthority: string;
  freezeAuthority: string;
  teamAllocation: string;
};
