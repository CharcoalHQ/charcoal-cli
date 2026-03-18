import fs from 'node:fs';
import path from 'node:path';

import type { CommandModule } from 'yargs';

import { createApiClient } from '../../api/client.js';
import { getApiKey } from '../../auth/credentials.js';

interface UploadArgs {
  namespace: string;
  dir: string;
  'schema-path'?: string;
}

const BATCH_SIZE = 1000;

const command: CommandModule<object, UploadArgs> = {
  command: 'upload',
  describe: 'Upload JSON documents from a directory',
  builder: {
    namespace: {
      type: 'string',
      describe: 'Target namespace',
      demandOption: true,
    },
    dir: {
      type: 'string',
      describe: 'Directory containing JSON files',
      demandOption: true,
    },
    'schema-path': {
      type: 'string',
      describe: 'Path to a JSON file defining the namespace attribute schema',
    },
  },
  handler: async (argv) => {
    const apiKey = getApiKey();
    const client = createApiClient(() => apiKey);
    const dir = path.resolve(argv.dir);

    let schema: Record<string, unknown> | undefined;
    if (argv['schema-path']) {
      schema = JSON.parse(fs.readFileSync(path.resolve(argv['schema-path']), 'utf-8'));
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('No JSON files found in directory.');
      return;
    }

    const allDocs: Record<string, unknown>[] = [];
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      if (Array.isArray(content)) {
        allDocs.push(...content);
      } else {
        allDocs.push(content);
      }
    }

    console.log(`Found ${allDocs.length} documents in ${files.length} files.`);

    let totalUpserted = 0;
    for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
      const batch = allDocs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allDocs.length / BATCH_SIZE);

      process.stdout.write(`Uploading batch ${batchNum}/${totalBatches}...`);
      const result = await client.post<{ documents_upserted: number }>(
        `/v1/namespaces/${encodeURIComponent(argv.namespace)}/documents`,
        { documents: batch, ...(schema !== undefined && { schema }) }
      );
      totalUpserted += result.documents_upserted;
      console.log(` ${result.documents_upserted} upserted.`);
    }

    console.log(`Done. ${totalUpserted} documents upserted total.`);
  },
};

export default command;
