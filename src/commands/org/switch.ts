import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { saveCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken, getUserScopedToken } from '../../auth/token_refresh.js';
import { CLI_KEY_NAME } from '../../constants.js';

interface Organization {
  id: string;
  name: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
}

interface ApiKeyCreateResponse {
  api_key: ApiKey;
  raw_key: string;
}

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
    const { accessToken } = await getUserScopedToken();
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

      const { api_keys } = await orgClient.get<{ api_keys: ApiKey[] }>('/v1/api_keys');
      const existingCliKey = api_keys.find((k) => k.name === CLI_KEY_NAME);
      if (existingCliKey) {
        await orgClient.delete(`/v1/api_keys/${existingCliKey.id}`);
      }

      const created = await orgClient.post<ApiKeyCreateResponse>('/v1/api_keys', {
        name: CLI_KEY_NAME,
      });

      credentials.organizations[selectedOrg.id] = {
        apiKey: created.raw_key,
        apiKeyPrefix: created.api_key.key_prefix,
        apiKeySuffix: created.api_key.key_suffix,
        organizationName: selectedOrg.name,
      };
    }

    credentials.activeOrganizationId = selectedOrg.id;
    saveCredentials(credentials);
    console.log(`Switched to organization: ${selectedOrg.name}`);
  },
};

export default command;
