# Charcoal CLI

Command-line interface for [Charcoal](https://withcharcoal.com) — manage organizations, API keys, documents, and namespaces, and search your content from the terminal.

## Installation

```sh
npm install -g @charcoalhq/cli
```

Also works with `pnpm add -g`, `yarn global add`, or `bun add -g`. Any of these give you a `charcoal` command on your `$PATH`.

Requires Node.js 20 or later.

## Getting started

```sh
charcoal login     # authenticate via browser
charcoal whoami    # verify the active user and org
```

## Commands

| Command | Description |
|---|---|
| `charcoal login` | Log in via browser authentication |
| `charcoal logout` | Clear stored credentials |
| `charcoal whoami` | Show current user and organization |
| `charcoal org` | Manage organizations (`list`, `switch`, `create`) |
| `charcoal keys` | Manage API keys (`create`, `list`, `delete`, `set`) |
| `charcoal docs` | Manage documents (`upload`, `get`) |
| `charcoal namespaces` | Manage namespaces |
| `charcoal search` | Search documents in a namespace |

Run any command with `--help` for details on its options.

## Development

This repo uses [Bun](https://bun.sh) for installing dependencies and building.

```sh
bun install
bun run dev -- <command>   # run the CLI directly from source
bun run typecheck          # type-check with tsc
bun run build              # bundle to dist/index.js
```

### Releasing

Releases are managed with [changesets](https://github.com/changesets/changesets). When you make a user-visible change:

```sh
bun changeset
```

Pick a bump type and write a short summary. Commit the generated file with your PR. When the PR merges to `main`, the release workflow opens a "Version Packages" PR that bumps the version and updates `CHANGELOG.md`. Merging that PR publishes to npm, creates a GitHub release, and attaches platform binaries.

## License

[MIT](./LICENSE)
