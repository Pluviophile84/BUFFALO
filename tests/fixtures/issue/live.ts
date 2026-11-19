// TEST FIXTURE — never deployed (the build refuses fixtures on Vercel).
// The address below is a placeholder, not a real token: base58, 43 characters, and it
// decodes to exactly 32 bytes like a real Solana public key (a 44-character string
// starting with "T" cannot: it decodes to 33).
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
  issueDate: '2026-12-01',
  xUrl: 'https://x.com/example',
  totalSupply: '1,000,000,000',
  mintAuthority: 'Revoked',
} as const;
