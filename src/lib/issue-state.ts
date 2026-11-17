// Build-time issue state. Importing this module validates the config; any
// violation throws and fails the build (see validate-issue.mjs).
import { ISSUE } from '@issue-config';
import { deriveIssue } from './validate-issue.mjs';

export type IssueState = {
  live: boolean;
  status: 'pre-issue' | 'live';
  statusLabel: 'Pre-issue' | 'In circulation';
  seriesYear: number;
  network: string;
  platform: string;
  siteUrl: string;
  serial: string | null;
  serialShort: string | null;
  explorerUrl: string | null;
  buyUrl: string | null;
  xUrl: string | null;
  telegramUrl: string | null;
  issueDate: string | null;
  issueDateLabel: string;
  facts: { totalSupply: string; mintAuthority: string; freezeAuthority: string; teamAllocation: string };
  pendingLabel: string;
  stagedContract: boolean;
};

export const issue: IssueState = deriveIssue(ISSUE);

/** Pick the paired string for the active state at build time (no hidden duplicates ship). */
export const pick = <T,>(pre: T, live: T): T => (issue.live ? live : pre);
