// TEST FIXTURE — live with a buy override on another defined route (Jupiter): the
// hero's primary action and the menu CTA read "Buy $BUFFALO".
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = {
  ...BASE,
  status: 'live',
  contractAddress: 'TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
  buyUrl: 'https://jup.ag/swap/SOL-TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump',
} as const;
