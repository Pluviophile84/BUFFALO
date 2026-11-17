// TEST FIXTURE — never deployed (the build refuses fixtures on Vercel).
// The address below is a syntactically valid placeholder, not a real token.
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMint7pQ2rS9vWxYz3aBcDeFgHjKmNpump',
  issueDate: '2026-12-01',
  xUrl: 'https://x.com/example',
  totalSupply: '1,000,000,000',
  mintAuthority: 'Revoked',
} as const;
