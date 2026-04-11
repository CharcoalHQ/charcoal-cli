import type { CommandModule } from 'yargs';

import { clearCredentials } from '../auth/credentials.js';

const command: CommandModule = {
  command: 'logout',
  describe: 'Clear stored credentials',
  handler: () => {
    clearCredentials();
    console.log('Logged out.');
  },
};

export default command;
