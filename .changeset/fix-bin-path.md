---
"@charcoalhq/cli": patch
---

Fix the `bin` path in `package.json` to avoid npm's auto-correct warning during publish. The leading `./` was being stripped by npm with a noisy warning; using `dist/index.js` directly matches what npm publishes anyway and silences the warning.
