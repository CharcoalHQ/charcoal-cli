import type { CommandModule } from 'yargs';

import { createApiClient } from '../api/client.js';
import { getApiKey, requireCredentials } from '../auth/credentials.js';

interface SearchArgs {
  namespace: string;
  query: string;
  goal: string;
  'api-key'?: string;
  json?: boolean;
}

interface SearchResult {
  session_id: string;
  status: string;
  synthesis: string;
  results: Array<{
    finding: string;
    id: string;
    excerpts: string[];
  }>;
  clarification_needed?: {
    question: string;
    options?: string[];
  };
}

const command: CommandModule<object, SearchArgs> = {
  command: 'search',
  describe: 'Search documents in a namespace',
  builder: {
    namespace: {
      type: 'string',
      describe: 'Namespace to search',
      demandOption: true,
    },
    goal: {
      type: 'string',
      describe: 'High-level goal for the search',
      demandOption: true,
    },
    query: {
      type: 'string',
      describe: 'Search query',
      demandOption: true,
    },
    'api-key': {
      type: 'string',
      describe: 'API key (overrides stored key)',
    },
    json: {
      type: 'boolean',
      describe: 'Output raw JSON instead of formatted text',
      default: false,
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey(requireCredentials(), argv['api-key']);
    const client = createApiClient(() => apiKey);
    const ns = encodeURIComponent(argv.namespace);

    const body = {
      high_level_goal: argv.goal,
      search_query: argv.query,
      stream: true,
    };

    const response = await client.stream(`/v1/namespaces/${ns}/search`, body);

    if (!response.body) {
      throw new Error('No response body received');
    }

    let finalResult: SearchResult | undefined;
    let statusCount = 0;
    let currentEvent = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (currentEvent === 'status' && data.message) {
            if (statusCount === 0) {
              process.stderr.write('\x1b[2mSearch progress:\x1b[0m\n');
            }
            statusCount++;
            process.stderr.write(`\x1b[2m  - ${data.message}\x1b[0m\n`);
          } else if (currentEvent === 'session_result') {
            if (statusCount > 0) {
              process.stderr.write('\n');
            }
            finalResult = data as SearchResult;
          } else if (currentEvent === 'error') {
            process.stderr.write('\n');
            throw new Error(`Search error: ${data.code ?? 'unknown'}`);
          }
        }
      }
    }

    if (!finalResult) {
      throw new Error('Search completed without results');
    }

    if (argv.json) {
      console.log(JSON.stringify(finalResult, null, 2));
      return;
    }

    if (finalResult.synthesis) {
      console.log(finalResult.synthesis);
      console.log();
    }

    if (finalResult.results.length > 0) {
      console.log(`── ${finalResult.results.length} results ──\n`);
      for (const result of finalResult.results) {
        console.log(`[${result.id}] ${result.finding}`);
        for (const excerpt of result.excerpts) {
          console.log(`  > ${excerpt}`);
        }
        console.log();
      }
    }

    if (finalResult.clarification_needed) {
      console.log(`Clarification needed: ${finalResult.clarification_needed.question}`);
      if (finalResult.clarification_needed.options) {
        for (const option of finalResult.clarification_needed.options) {
          console.log(`  - ${option}`);
        }
      }
    }
  },
};

export default command;
