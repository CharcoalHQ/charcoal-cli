import type { CommandModule } from 'yargs';

import { getActiveOrg, requireCredentials } from '../auth/credentials.js';

const command: CommandModule = {
  command: 'whoami',
  describe: 'Show current user and organization',
  handler: () => {
    const creds = requireCredentials();
    const org = getActiveOrg(creds);
    const userDisplay = creds.user
      ? `${creds.user.email} (${creds.user.id})`
      : '(not available)';
    console.log(`User:         ${userDisplay}`);
    console.log(`Organization: ${org.organizationName} (${org.id})`);
    const keyDisplay = org.apiKeyPrefix && org.apiKeySuffix
      ? `${org.apiKeyPrefix}...${org.apiKeySuffix}`
      : '(set)';
    console.log(`API Key:      ${keyDisplay}`);
  },
};

export default command;
