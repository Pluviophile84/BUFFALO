// TEST FIXTURE — pre-issue with another siteUrl: canonical, OG and the sitemap must all
// follow the config the build reads (one config source, through deriveIssue()).
import { ISSUE as BASE } from '../../../src/config/issue.ts';
export const ISSUE = { ...BASE, siteUrl: 'https://fixture.example.org' } as const;
