import type { CommandModule } from 'yargs';

import { createApiClient } from '../api/client.js';
import { requireCredentials } from '../auth/credentials.js';
import { getOrgScopedToken } from '../auth/token_refresh.js';
import { outputTable } from '../output.js';

interface NamespaceStats {
  id: number;
  name: string;
  document_count: number;
  storage_bytes: number;
  created_at: string;
  updated_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const listCommand: CommandModule = {
  command: 'list',
  describe: 'List namespaces',
  handler: async () => {
    const creds = requireCredentials();
    const { accessToken } = await getOrgScopedToken(creds.activeOrganizationId);
    const client = createApiClient(() => accessToken);
    const { results } = await client.get<{ results: NamespaceStats[] }>('/v1/namespaces/stats');

    if (results.length === 0) {
      console.log('No namespaces found.');
      return;
    }

    outputTable(
      ['Name', 'Documents', 'Size', 'Updated'],
      results.map((ns) => [
        ns.name,
        ns.document_count.toLocaleString(),
        formatBytes(ns.storage_bytes),
        new Date(ns.updated_at).toLocaleDateString(),
      ])
    );
  },
};

export default listCommand;
