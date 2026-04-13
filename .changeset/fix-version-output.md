---
"@charcoalhq/cli": patch
---

Fix `charcoal --version` reporting a wrong version. Yargs auto-detection doesn't work after bun bundles the CLI into a single file — it picks up a random dependency's `package.json` instead of ours. Now reads the version explicitly from `package.json` at build time.
