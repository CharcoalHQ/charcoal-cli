import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';
import { outputTable } from '../../output.js';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
}

const command: CommandModule = {
  command: 'list',
  describe: 'List API keys',
  handler: async () => {
    const creds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const { api_keys } = await client.get<{ api_keys: ApiKey[] }>('/v1/api_keys');

    if (api_keys.length === 0) {
      console.log('No API keys found.');
      return;
    }

    outputTable(
      ['ID', 'Name', 'Prefix', 'Created By', 'Created At', 'Last Used'],
      api_keys.map((k) => [
        k.id,
        k.name,
        `${k.key_prefix}...${k.key_suffix}`,
        k.created_by,
        new Date(k.created_at).toLocaleDateString(),
        k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never',
      ])
    );
  },
};

export default command;
