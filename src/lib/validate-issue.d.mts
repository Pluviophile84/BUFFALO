export const X_HOSTS: readonly string[];
export const TELEGRAM_HOSTS: readonly string[];
export type Route = { route: string; host: string; test: (u: URL, mint: string) => boolean };
export const EXPLORER_ROUTES: readonly Route[];
export const BUY_ROUTES: readonly Route[];
export class IssueConfigError extends Error {
  problems: string[];
}
export function base58Decode(s: string): Uint8Array | null;
export function isSolanaAddress(s: string): boolean;
export function matchesRoute(url: string, mint: string, routes: readonly Route[]): boolean;
export function isCalendarDate(s: string): boolean;
export function shortSerial(address: string): string;
export function formatIssueDate(iso: string): string;
export function deriveIssue(cfg: import('../config/issue').IssueConfig): any;
