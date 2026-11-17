// TEST FIXTURE — must FAIL the build: live without a serial.
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = { ...BASE, status: 'live', contractAddress: '' } as const;
