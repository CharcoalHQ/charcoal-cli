# Changesets

This directory contains [changesets](https://github.com/changesets/changesets) — markdown files describing changes that should produce a version bump and changelog entry.

## Adding a changeset

When you make a change that should be released, run:

```
bun changeset
```

Pick the bump type (`patch` / `minor` / `major`) and write a short summary. Commit the generated file alongside your change.

## How releases happen

1. PRs that include a changeset are merged to `main`.
2. The `release` workflow opens (or updates) a "Version Packages" PR that bumps the version in `package.json` and updates `CHANGELOG.md` based on pending changesets.
3. Merging the Version Packages PR publishes to npm, creates a git tag, and creates a GitHub release.
4. The `release-cli` workflow builds platform binaries and attaches them to the GitHub release.
