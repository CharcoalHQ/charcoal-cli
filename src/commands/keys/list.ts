import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';
import { outputTable } from '../../output.js';

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  keySuffix: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const command: CommandModule = {
  command: 'list',
  describe: 'List API keys',
  handler: async () => {
    const creds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const { apiKeys } = await client.get<{ apiKeys: ApiKey[] }>('/v1/api_keys');

    if (apiKeys.length === 0) {
      console.log('No API keys found.');
      return;
    }

    outputTable(
      ['ID', 'Name', 'Prefix', 'Created By', 'Created At', 'Last Used'],
      apiKeys.map((k) => [
        String(k.id),
        k.name,
        `${k.keyPrefix}...${k.keySuffix}`,
        k.createdBy,
        new Date(k.createdAt).toLocaleDateString(),
        k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never',
      ])
    );
  },
};

export default command;
