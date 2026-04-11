---
"@charcoalhq/cli": patch
---

Install dependencies in the `build-binaries` job before running `bun build --compile`. Without this, the compile step fails with `Could not resolve: "yargs"` because `node_modules/` doesn't exist on a fresh runner.
