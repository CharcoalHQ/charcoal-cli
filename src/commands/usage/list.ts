import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey } from '../../auth/credentials.js';
import { outputTable } from '../../output.js';

interface ListArgs {
  limit: number;
  before?: number;
  json?: boolean;
}

interface UsageEventListItem {
  request_id: string;
  event_type: string;
  occurred_at: string;
  namespace: string | null;
  duration_ms: number | null;
  search: {
    request: { objective: string | null; context: string | null };
    response: { result_count: number };
  };
}

interface ListResponse {
  results: UsageEventListItem[];
  next_cursor: number | null;
}

function truncate(value: string | null, max: number): string {
  if (!value) return '-';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

const command: CommandModule<object, ListArgs> = {
  command: 'list',
  describe: 'List recent usage events',
  builder: {
    limit: {
      type: 'number',
      describe: 'Maximum events to return (1-100)',
      default: 50,
    },
    before: {
      type: 'number',
      describe: 'Pagination cursor from a previous list call',
    },
    json: {
      type: 'boolean',
      describe: 'Output raw JSON instead of a formatted table',
      default: false,
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey();
    const client = createApiClient(() => apiKey);

    const params = new URLSearchParams();
    params.set('limit', String(argv.limit));
    if (argv.before !== undefined) {
      params.set('before', String(argv.before));
    }

    const response = await client.get<ListResponse>(`/v1/usage_events?${params.toString()}`);

    if (argv.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    if (response.results.length === 0) {
      console.log('No usage events found.');
      return;
    }

    outputTable(
      ['Request ID', 'Event', 'Namespace', 'Objective', 'Results', 'Duration', 'Occurred At'],
      response.results.map((e) => [
        e.request_id,
        e.event_type,
        e.namespace ?? '-',
        truncate(e.search.request.objective, 40),
        String(e.search.response.result_count),
        e.duration_ms !== null ? `${e.duration_ms} ms` : '-',
        new Date(e.occurred_at).toLocaleString(),
      ])
    );

    if (response.next_cursor !== null) {
      console.log(`\nMore results available. Next page: --before ${response.next_cursor}`);
    }
  },
};

export default command;
