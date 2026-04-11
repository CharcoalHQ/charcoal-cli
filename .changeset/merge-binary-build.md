---
"@charcoalhq/cli": patch
---

Merge the binary build workflow into the release workflow so platform binaries are attached to each GitHub release automatically. Previously the binary build lived in a separate workflow triggered on `release: published`, but GitHub Actions does not dispatch downstream workflows for events created by the default `GITHUB_TOKEN`, so that trigger never fired. Binaries now build as a follow-up job in the same run that publishes to npm.
