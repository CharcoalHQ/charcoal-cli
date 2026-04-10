#!/usr/bin/env tsx
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import login from './commands/login.js';
import logout from './commands/logout.js';
import whoami from './commands/whoami.js';
import orgList from './commands/org/list.js';
import orgSwitch from './commands/org/switch.js';
import orgCreate from './commands/org/create.js';
import keysCreate from './commands/keys/create.js';
import keysList from './commands/keys/list.js';
import keysDelete from './commands/keys/delete.js';
import keysSet from './commands/keys/set.js';
import docsUpload from './commands/docs/upload.js';
import docsGet from './commands/docs/get.js';
import search from './commands/search.js';
import namespacesListCommand from './commands/namespaces.js';
import { outputError } from './output.js';

try {
  await yargs(hideBin(process.argv))
    .scriptName('charcoal')
    .command(login)
    .command(logout)
    .command(whoami)
    .command('org', 'Manage organizations', (yargs) =>
      yargs
        .command(orgList)
        .command(orgSwitch)
        .command(orgCreate)
        .demandCommand(1, 'Please specify an org subcommand')
    )
    .command('keys', 'Manage API keys', (yargs) =>
      yargs
        .command(keysCreate)
        .command(keysList)
        .command(keysDelete)
        .command(keysSet)
        .demandCommand(1, 'Please specify a keys subcommand')
    )
    .command('docs', 'Manage documents', (yargs) =>
      yargs
        .command(docsUpload)
        .command(docsGet)
        .demandCommand(1, 'Please specify a docs subcommand')
    )
    .command(search)
    .command('namespaces', 'Manage namespaces', (yargs) =>
      yargs
        .command(namespacesListCommand)
        .demandCommand(1, 'Please specify a namespaces subcommand')
    )
    .demandCommand(1)
    .strict()
    .fail((msg, err, yargs) => {
      if (err) {
        outputError(err);
        process.exit(1);
      }
      yargs.showHelp();
    })
    .parseAsync();
} catch {
  // Handled by .fail() above.
}
