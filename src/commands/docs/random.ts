import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey } from '../../auth/credentials.js';
import { outputJson } from '../../output.js';

interface RandomDocArgs {
  namespace: string;
}

const command: CommandModule<object, RandomDocArgs> = {
  command: 'random',
  describe: 'Get a random document from a namespace',
  builder: {
    namespace: {
      type: 'string',
      describe: 'Namespace name',
      demandOption: true,
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey();
    const client = createApiClient(() => apiKey);
    const doc = await client.get<Record<string, unknown>>(
      `/v1/namespaces/${encodeURIComponent(argv.namespace)}/random_document`
    );
    outputJson(doc);
  },
};

export default command;
