import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey } from '../../auth/credentials.js';
import { outputJson } from '../../output.js';

interface GetArgs {
  'request-id': string;
}

const command: CommandModule<object, GetArgs> = {
  command: 'get <request-id>',
  describe: 'Fetch a specific usage event by request ID',
  builder: (yargs) =>
    yargs.positional('request-id', {
      type: 'string',
      describe: 'Request ID from `charcoal usage list`',
      demandOption: true,
    }) as unknown as import('yargs').Argv<GetArgs>,
  handler: async (argv) => {
    const apiKey = getApiKey();
    const client = createApiClient(() => apiKey);

    try {
      const event = await client.get<Record<string, unknown>>(
        `/v1/usage_events/${encodeURIComponent(argv['request-id'])}`
      );
      outputJson(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('(404)')) {
        throw new Error(
          `Usage event not found: ${argv['request-id']}. Run \`charcoal usage list\` to see recent events.`
        );
      }
      throw err;
    }
  },
};

export default command;
