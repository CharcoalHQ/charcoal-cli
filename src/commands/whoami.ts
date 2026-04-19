import type { CommandModule } from 'yargs';

import { getActiveOrg, requireCredentials } from '../auth/credentials.js';
import { API_BASE_URL, CHARCOAL_ENV } from '../constants.js';

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
    console.log(`Env:          ${CHARCOAL_ENV}`);
    console.log(`API URL:      ${API_BASE_URL}`);
  },
};

export default command;
