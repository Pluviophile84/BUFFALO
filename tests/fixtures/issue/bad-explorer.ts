// TEST FIXTURE — must FAIL the build: the explorer override names another mint.
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
  explorerUrl: 'https://solscan.io/token/So11111111111111111111111111111111111111112',
} as const;
