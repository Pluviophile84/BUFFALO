// TEST FIXTURE — live with empty explorer/buy: both must derive from the serial.
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = { ...BASE, status: 'live', contractAddress: 'TestFixtureMint7pQ2rS9vWxYz3aBcDeFgHjKmNpump', explorerUrl: '', buyUrl: '' } as const;
