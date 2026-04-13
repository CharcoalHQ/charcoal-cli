import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';

interface ApiKeyCreateResponse {
  api_key: {
    id: string;
    name: string;
    key_prefix: string;
    key_suffix: string;
  };
  raw_key: string;
}

interface CreateKeyArgs {
  name?: string;
}

const command: CommandModule<object, CreateKeyArgs> = {
  command: 'create',
  describe: 'Create a new API key',
  builder: {
    name: {
      type: 'string',
      describe: 'API key name',
    },
  },
  handler: async (argv) => {
    const creds = requireCredentials();

    let name = argv.name;
    if (!name) {
      if (process.stdin.isTTY) {
        const { input } = await import('@inquirer/prompts');
        name = await input({ message: 'API key name:' });
      } else {
        throw new Error('--name is required in non-interactive mode');
      }
    }

    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const created = await client.post<ApiKeyCreateResponse>('/v1/api_keys', { name });

    console.log(`Created API key: ${created.api_key.name}`);
    console.log(`Key: ${created.raw_key}`);
    console.log('\nThis key will not be shown again. Store it securely.');
  },
};

export default command;
