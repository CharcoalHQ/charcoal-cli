---
"@charcoalhq/cli": patch
---

Update the CLI to read the new snake_case response shape from `/v1/api_keys` (`api_keys`, `api_key`, `raw_key`, `key_prefix`, `key_suffix`, `created_by`, `created_at`, `last_used_at`). The server-side change is breaking, so this version of the CLI is only compatible with API versions that return the new shape.
