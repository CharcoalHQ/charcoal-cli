import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { requireCredentials } from '../../auth/credentials.js';
import { getOrgScopedToken } from '../../auth/token_refresh.js';

interface DeleteKeyArgs {
  id: number;
}

const command: CommandModule<object, DeleteKeyArgs> = {
  command: 'delete',
  describe: 'Delete an API key',
  builder: {
    id: {
      type: 'number',
      describe: 'API key ID',
      demandOption: true,
    },
  },
  handler: async (argv) => {
    const creds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    await client.delete(`/v1/api_keys/${argv.id}`);
    console.log(`Deleted API key ${argv.id}.`);
  },
};

export default command;
