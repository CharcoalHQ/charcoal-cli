# @charcoalhq/cli

## 0.0.11

### Patch Changes

- f3c6e1e: Auth edge case fixes

  - Surface real WorkOS errors (no more misleading "Refresh token expired" for every 400); only re-auth on actual token expiry.
  - Handle deleted/missing active organization with an actionable message.
  - `org list`, `org switch`, `org create` no longer require the active org to be valid — they use a user-scoped token.
  - Per-machine CLI API key names (`Charcoal CLI — $hostname`) so logging in on one machine no longer deletes another machine's key.
  - Respect keys set via `keys set` — login no longer clobbers user-provided keys.
  - Persist rotated refresh token mid-login so a failure doesn't strand the user.
  - Tighten `~/.charcoal` dir perms to `0o700`.
  - Fix outdated `search` command arg types.

## 0.0.10

### Patch Changes

- dd2a2f6: Fix `charcoal --version` reporting a wrong version. Yargs auto-detection doesn't work after bun bundles the CLI into a single file — it picks up a random dependency's `package.json` instead of ours. Now reads the version explicitly from `package.json` at build time.

## 0.0.9

### Patch Changes

- 1a1b7bd: Update the CLI to read the new snake_case response shape from `/v1/api_keys` (`api_keys`, `api_key`, `raw_key`, `key_prefix`, `key_suffix`, `created_by`, `created_at`, `last_used_at`). The server-side change is breaking, so this version of the CLI is only compatible with API versions that return the new shape.

## 0.0.8

### Patch Changes

- 969bbd1: Drop standalone binary distribution. Prebuilt binaries produced by `bun build --compile` are unsigned, and on Apple Silicon macOS the kernel refuses to load arm64 binaries without even an ad-hoc signature, so the binaries we were attaching to GitHub releases were broken for every macOS user. Rather than maintain a codesigning pipeline, the CLI is now distributed exclusively via npm (`npm install -g @charcoalhq/cli`), which works on any platform with Node.js 20+.

## 0.0.7

### Patch Changes

- c2bcbda: Install dependencies in the `build-binaries` job before running `bun build --compile`. Without this, the compile step fails with `Could not resolve: "yargs"` because `node_modules/` doesn't exist on a fresh runner.

## 0.0.6

### Patch Changes

- 6a65e5d: Merge the binary build workflow into the release workflow so platform binaries are attached to each GitHub release automatically. Previously the binary build lived in a separate workflow triggered on `release: published`, but GitHub Actions does not dispatch downstream workflows for events created by the default `GITHUB_TOKEN`, so that trigger never fired. Binaries now build as a follow-up job in the same run that publishes to npm.

## 0.0.5

### Patch Changes

- 3ce4c9a: Fix the `bin` path in `package.json` to avoid npm's auto-correct warning during publish. The leading `./` was being stripped by npm with a noisy warning; using `dist/index.js` directly matches what npm publishes anyway and silences the warning.

## 0.0.4

### Patch Changes

- 424320d: Switch the release pipeline to npm OIDC trusted publishing with provenance attestations.

## 0.0.3

### Patch Changes

- 2bafec1: Initial release from the new standalone `charcoal-cli` repository.
