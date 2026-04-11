import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';
import { outputTable } from '../../output.js';

interface Organization {
  id: string;
  name: string;
}

const command: CommandModule = {
  command: 'list',
  describe: 'List your organizations',
  handler: async () => {
    const creds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const { organizations } = await client.get<{ organizations: Organization[] }>(
      '/v1/user/organizations'
    );

    if (organizations.length === 0) {
      console.log('No organizations found.');
      return;
    }

    outputTable(
      ['', 'ID', 'Name'],
      organizations.map((o) => [o.id === creds.activeOrganizationId ? '*' : '', o.id, o.name])
    );
  },
};

export default command;
