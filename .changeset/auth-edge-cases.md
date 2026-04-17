---
"@charcoalhq/cli": patch
---

Auth edge case fixes

- Surface real WorkOS errors (no more misleading "Refresh token expired" for every 400); only re-auth on actual token expiry.
- Handle deleted/missing active organization with an actionable message.
- `org list`, `org switch`, `org create` no longer require the active org to be valid — they use a user-scoped token.
- Per-machine CLI API key names (`Charcoal CLI — $hostname`) so logging in on one machine no longer deletes another machine's key.
- Respect keys set via `keys set` — login no longer clobbers user-provided keys.
- Persist rotated refresh token mid-login so a failure doesn't strand the user.
- Tighten `~/.charcoal` dir perms to `0o700`.
- Fix outdated `search` command arg types.
