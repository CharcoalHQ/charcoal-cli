# @charcoalhq/cli

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
