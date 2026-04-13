import type { CommandModule } from 'yargs';

import { createApiClient } from '../api/client.js';
import { performOAuthLogin } from '../auth/oauth.js';
import { type Credentials, loadCredentials, saveCredentials } from '../auth/credentials.js';
import { refreshTokenForOrg } from '../auth/token_refresh.js';

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

const CLI_KEY_NAME = 'Charcoal CLI';

interface LoginArgs {
  org?: string;
  apiKey?: string;
}

const command: CommandModule<object, LoginArgs> = {
  command: 'login',
  describe: 'Log in via browser authentication',
  builder: {
    org: {
      type: 'string',
      describe: 'Organization ID to log in to directly',
    },
    'api-key': {
      type: 'string',
      describe: 'API key for headless/CI authentication (skips browser login)',
    },
  },
  handler: async (argv) => {
    if (argv.apiKey) {
      const client = createApiClient(() => argv.apiKey!);
      const { organizationId, organizationName } = await client.get<{
        organizationId: string;
        organizationName: string;
      }>('/v1/whoami');

      const creds: Credentials = {
        activeOrganizationId: organizationId,
        organizations: {
          [organizationId]: {
            apiKey: argv.apiKey,
            organizationName,
          },
        },
      };

      saveCredentials(creds);
      console.log('Login complete.');
      return;
    }
    const result = await performOAuthLogin();
    console.log(`Authenticated as ${result.user.email}`);

    // Preserve existing org credentials if re-logging in.
    const existing = loadCredentials();

    const userClient = createApiClient(() => result.accessToken);
    const { organizations } = await userClient.get<{ organizations: Organization[] }>(
      '/v1/user/organizations'
    );

    let selectedOrg: Organization | undefined;

    if (argv.org) {
      selectedOrg = organizations.find((o) => o.id === argv.org);
      if (!selectedOrg) {
        throw new Error(`Organization ${argv.org} not found`);
      }
    } else if (organizations.length === 1) {
      selectedOrg = organizations[0];
      console.log(`Auto-selected organization: ${selectedOrg.name}`);
    } else if (organizations.length > 1) {
      if (process.stdin.isTTY) {
        const { select } = await import('@inquirer/prompts');
        const choice = await select({
          message: 'Select an organization:',
          choices: organizations.map((o) => ({ name: o.name, value: o.id })),
        });
        selectedOrg = organizations.find((o) => o.id === choice);
      } else {
        console.log('Multiple organizations found. Use --org <id> to select one:');
        for (const org of organizations) {
          console.log(`  ${org.id}  ${org.name}`);
        }
        return;
      }
    } else if (organizations.length === 0) {
      if (process.stdin.isTTY) {
        const { input, confirm } = await import('@inquirer/prompts');
        const shouldCreate = await confirm({
          message: 'No organizations found. Create one?',
          default: true,
        });
        if (shouldCreate) {
          const name = await input({ message: 'Organization name:' });
          const { organizationId } = await userClient.post<{ organizationId: string }>(
            '/v1/onboarding/organization',
            { name, idempotencyKey: crypto.randomUUID() }
          );
          selectedOrg = { id: organizationId, name };
          console.log(`Created organization: ${name}`);
        }
      } else {
        console.log('No organizations found. Use `charcoal org create --name <name>` to create one.');
        return;
      }
    }

    if (!selectedOrg) {
      return;
    }

    // Build credentials, preserving existing org keys.
    const creds: Credentials = {
      user: result.user,
      refreshToken: result.refreshToken,
      activeOrganizationId: selectedOrg.id,
      organizations: existing?.organizations ?? {},
    };

    // Ensure a valid CLI API key exists for this org.
    const orgTokens = await refreshTokenForOrg(result.refreshToken, selectedOrg.id);
    creds.refreshToken = orgTokens.refreshToken;
    const orgClient = createApiClient(() => orgTokens.accessToken);
    const { api_keys } = await orgClient.get<{ api_keys: ApiKey[] }>('/v1/api_keys');

    // Check if the stored key still exists on the server by matching prefix + suffix.
    const storedOrg = creds.organizations[selectedOrg.id];
    const storedKeyExists = storedOrg?.apiKeyPrefix && storedOrg?.apiKeySuffix &&
      api_keys.some((k) => k.key_prefix === storedOrg.apiKeyPrefix && k.key_suffix === storedOrg.apiKeySuffix);

    if (!storedKeyExists) {
      // Clean up any old CLI key on the server.
      const existingCliKey = api_keys.find((k) => k.name === CLI_KEY_NAME);
      if (existingCliKey) {
        await orgClient.delete(`/v1/api_keys/${existingCliKey.id}`);
      }

      const created = await orgClient.post<ApiKeyCreateResponse>('/v1/api_keys', {
        name: CLI_KEY_NAME,
      });

      creds.organizations[selectedOrg.id] = {
        apiKey: created.raw_key,
        apiKeyPrefix: created.api_key.key_prefix,
        apiKeySuffix: created.api_key.key_suffix,
        organizationName: selectedOrg.name,
      };
    }

    saveCredentials(creds);
    console.log('Login complete.');
  },
};

export default command;
