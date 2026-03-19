import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey } from '../../auth/credentials.js';
import { outputJson } from '../../output.js';

interface GetDocArgs {
  namespace: string;
  id: string;
}

const command: CommandModule<object, GetDocArgs> = {
  command: 'get',
  describe: 'Get a specific document',
  builder: {
    namespace: {
      type: 'string',
      describe: 'Namespace name',
      demandOption: true,
    },
    id: {
      type: 'string',
      describe: 'Document ID',
      demandOption: true,
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey();
    const client = createApiClient(() => apiKey);
    const doc = await client.get<Record<string, unknown>>(
      `/v1/namespaces/${encodeURIComponent(argv.namespace)}/documents/${encodeURIComponent(argv.id)}`
    );
    outputJson(doc);
  },
};

export default command;
