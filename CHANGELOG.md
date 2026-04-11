# @charcoalhq/cli

## 0.0.5

### Patch Changes

- 3ce4c9a: Fix the `bin` path in `package.json` to avoid npm's auto-correct warning during publish. The leading `./` was being stripped by npm with a noisy warning; using `dist/index.js` directly matches what npm publishes anyway and silences the warning.

## 0.0.4

### Patch Changes

- 424320d: Switch the release pipeline to npm OIDC trusted publishing with provenance attestations.

## 0.0.3

### Patch Changes

- 2bafec1: Initial release from the new standalone `charcoal-cli` repository.
