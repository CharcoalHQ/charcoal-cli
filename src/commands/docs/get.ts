import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey, requireCredentials } from '../../auth/credentials.js';
import { outputJson } from '../../output.js';

interface GetDocArgs {
  namespace: string;
  id: string;
  'api-key'?: string;
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
    'api-key': {
      type: 'string',
      describe: 'API key (overrides stored key)',
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey(requireCredentials(), argv['api-key']);
    const client = createApiClient(() => apiKey);
    const { results } = await client.get<{ results: Record<string, unknown>[] }>(
      `/v1/namespaces/${encodeURIComponent(argv.namespace)}/documents`
    );

    const doc = results.find((d) => d.id === argv.id);
    if (!doc) {
      throw new Error(`Document ${argv.id} not found in namespace ${argv.namespace}`);
    }

    outputJson(doc);
  },
};

export default command;
