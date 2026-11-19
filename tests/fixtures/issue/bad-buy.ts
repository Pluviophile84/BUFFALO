// TEST FIXTURE — must FAIL the build: the buy override is not a defined route
// (a DEX pair page, with the mint only in its query string).
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
  buyUrl: 'https://dexscreener.com/solana/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?token=TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
} as const;
