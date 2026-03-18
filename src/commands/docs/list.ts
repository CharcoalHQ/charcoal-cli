import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey, requireCredentials } from '../../auth/credentials.js';
import { outputJson, outputTable } from '../../output.js';

interface ListDocsArgs {
  namespace: string;
  'api-key'?: string;
  json?: boolean;
  limit?: number;
  offset?: number;
}

const command: CommandModule<object, ListDocsArgs> = {
  command: 'list',
  describe: 'List documents in a namespace',
  builder: {
    namespace: {
      type: 'string',
      describe: 'Namespace name',
      demandOption: true,
    },
    'api-key': {
      type: 'string',
      describe: 'API key (overrides stored key)',
    },
    json: {
      type: 'boolean',
      describe: 'Output as JSON',
      default: false,
    },
    limit: {
      type: 'number',
      describe: 'Maximum number of documents to show',
      default: 50,
    },
    offset: {
      type: 'number',
      describe: 'Number of documents to skip',
      default: 0,
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey(requireCredentials(), argv['api-key']);
    const client = createApiClient(() => apiKey);
    const { results } = await client.get<{ results: Record<string, unknown>[] }>(
      `/v1/namespaces/${encodeURIComponent(argv.namespace)}/documents`
    );

    const offset = argv.offset ?? 0;
    const limit = argv.limit ?? 50;
    const page = results.slice(offset, offset + limit);
    const total = results.length;

    if (argv.json) {
      outputJson(page);
      return;
    }

    if (page.length === 0) {
      console.log('No documents found.');
      return;
    }

    outputTable(
      ['ID'],
      page.map((d) => [String(d.id)])
    );

    const showing = `${offset + 1}–${offset + page.length}`;
    console.log(`\nShowing ${showing} of ${total} documents.`);
    if (offset + limit < total) {
      console.log(`Use --offset ${offset + limit} to see more.`);
    }
  },
};

export default command;
