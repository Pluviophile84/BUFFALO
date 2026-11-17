export const BUY_EXPLORER_HOSTS: readonly string[];
export const X_HOSTS: readonly string[];
export const TELEGRAM_HOSTS: readonly string[];
export class IssueConfigError extends Error {
  problems: string[];
}
export function shortSerial(address: string): string;
export function formatIssueDate(iso: string): string;
export function deriveIssue(cfg: import('../config/issue').IssueConfig): any;
