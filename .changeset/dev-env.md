---
"@charcoalhq/cli": patch
---

Add `CHARCOAL_ENV=dev` to point the CLI at a local dev API with a separate credentials file. Fix command handler errors being silently swallowed instead of printed with exit 1.
