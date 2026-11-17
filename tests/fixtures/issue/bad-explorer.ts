// TEST FIXTURE — must FAIL the build: explorer override does not contain the serial.
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMint7pQ2rS9vWxYz3aBcDeFgHjKmNpump',
  explorerUrl: 'https://solscan.io/token/So11111111111111111111111111111111111111112',
} as const;
