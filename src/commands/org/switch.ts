import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials, saveCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';

interface Organization {
  id: string;
  name: string;
}

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

interface SwitchArgs {
  org?: string;
}

const command: CommandModule<object, SwitchArgs> = {
  command: 'switch',
  describe: 'Switch active organization',
  builder: {
    org: {
      type: 'string',
      describe: 'Organization ID to switch to',
    },
  },
  handler: async (argv) => {
    const initialCreds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(initialCreds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const { organizations } = await client.get<{ organizations: Organization[] }>(
      '/v1/user/organizations'
    );

    let selectedOrg: Organization | undefined;

    if (argv.org) {
      selectedOrg = organizations.find((o) => o.id === argv.org);
      if (!selectedOrg) {
        throw new Error(`Organization ${argv.org} not found`);
      }
    } else if (process.stdin.isTTY) {
      const { select } = await import('@inquirer/prompts');
      const choice = await select({
        message: 'Select an organization:',
        choices: organizations.map((o) => ({ name: o.name, value: o.id })),
      });
      selectedOrg = organizations.find((o) => o.id === choice);
    } else {
      throw new Error('Use --org <id> to specify an organization in non-interactive mode');
    }

    if (!selectedOrg) {
      throw new Error('No organization selected');
    }

    // Get org-scoped token for the target org. credentials has the fresh refresh token.
    const { accessToken: orgAccessToken, credentials } = await getOrgScopedToken(selectedOrg.id);

    if (!credentials.organizations[selectedOrg.id]) {
      const orgClient = createApiClient(() => orgAccessToken);

      const { apiKeys } = await orgClient.get<{ apiKeys: ApiKey[] }>('/v1/api_keys');
      const existingCliKey = apiKeys.find((k) => k.name === CLI_KEY_NAME);
      if (existingCliKey) {
        await orgClient.delete(`/v1/api_keys/${existingCliKey.id}`);
      }

      const created = await orgClient.post<ApiKeyCreateResponse>('/v1/api_keys', {
        name: CLI_KEY_NAME,
      });

      credentials.organizations[selectedOrg.id] = {
        apiKey: created.rawKey,
        apiKeyPrefix: created.apiKey.keyPrefix,
        apiKeySuffix: created.apiKey.keySuffix,
        organizationName: selectedOrg.name,
      };
    }

    credentials.activeOrganizationId = selectedOrg.id;
    saveCredentials(credentials);
    console.log(`Switched to organization: ${selectedOrg.name}`);
  },
};

export default command;
