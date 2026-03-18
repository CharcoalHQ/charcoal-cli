import type { CommandModule } from 'yargs';

import { getActiveOrg, requireCredentials, saveCredentials } from '../../auth/credentials.js';

interface SetKeyArgs {
  key?: string;
}

const command: CommandModule<object, SetKeyArgs> = {
  command: 'set',
  describe: 'Override the stored API key for the active organization',
  builder: {
    key: {
      type: 'string',
      describe: 'API key to store',
    },
  },
  handler: async (argv) => {
    const creds = requireCredentials();
    const org = getActiveOrg(creds);

    let key = argv.key;
    if (!key) {
      if (process.stdin.isTTY) {
        const { password } = await import('@inquirer/prompts');
        key = await password({ message: 'Paste your API key:' });
      } else {
        throw new Error('--key is required in non-interactive mode');
      }
    }

    creds.organizations[org.id] = {
      ...creds.organizations[org.id],
      apiKey: key,
      apiKeyPrefix: undefined,
      apiKeySuffix: undefined,
    };
    saveCredentials(creds);
    console.log('API key saved.');
  },
};

export default command;
