import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials, saveCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  keySuffix: string;
}

interface ApiKeyCreateResponse {
  apiKey: ApiKey;
  rawKey: string;
}

const CLI_KEY_NAME = 'Charcoal CLI';

interface CreateOrgArgs {
  name?: string;
}

const command: CommandModule<object, CreateOrgArgs> = {
  command: 'create',
  describe: 'Create a new organization',
  builder: {
    name: {
      type: 'string',
      describe: 'Organization name',
    },
  },
  handler: async (argv) => {
    let name = argv.name;
    if (!name) {
      if (process.stdin.isTTY) {
        const { input } = await import('@inquirer/prompts');
        name = await input({ message: 'Organization name:' });
      } else {
        throw new Error('--name is required in non-interactive mode');
      }
    }

    const initialCreds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(initialCreds.activeOrganizationId);
    const userClient = createApiClient(() => accessToken);
    const { organizationId } = await userClient.post<{ organizationId: string }>(
      '/v1/onboarding/organization',
      { name, idempotencyKey: crypto.randomUUID() }
    );

    console.log(`Created organization: ${name} (${organizationId})`);

    // Get org-scoped token for the new org. credentials has the fresh refresh token.
    const { accessToken: orgAccessToken, credentials } = await getOrgScopedToken(organizationId);
    const orgClient = createApiClient(() => orgAccessToken);
    const created = await orgClient.post<ApiKeyCreateResponse>('/v1/api_keys', {
      name: CLI_KEY_NAME,
    });

    credentials.organizations[organizationId] = {
      apiKey: created.rawKey,
      apiKeyPrefix: created.apiKey.keyPrefix,
      apiKeySuffix: created.apiKey.keySuffix,
      organizationName: name,
    };
    credentials.activeOrganizationId = organizationId;
    saveCredentials(credentials);

    console.log('Switched to new organization.');
  },
};

export default command;
