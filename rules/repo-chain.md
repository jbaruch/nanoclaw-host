---
alwaysApply: true
---

# Repo Chain and Upstream Safety

## Repository roles

- `qwibitai/nanoclaw` is the original upstream project.
- `jbaruch/nanoclaw` is the private deployment with private integrations and personal content.
- The public fork is retired. Do not export snapshots or cherry-pick private changes to a public mirror.

## Incoming updates

- Pull upstream updates directly from `qwibitai/nanoclaw` into a branch in private.
- The private checkout's `origin` targets `jbaruch/nanoclaw`; its `upstream` remote targets `qwibitai/nanoclaw`.
- Verify remote URLs before fetching. Replace retired public-fork targets when updating private.
- Merge incoming updates through a reviewed private PR. Preserve private integrations and personal configuration during conflict resolution.

## Upstream contributions

- Fetching upstream for an update is permitted.
- Creating PRs, posting comments or issues, and pushing branches to `qwibitai/*` require explicit user authorization.
- Private code and personal content must not reach upstream without review of the proposed contribution.

## Explicit GitHub targets

- Pass an explicit `--repo` target on repository-scoped `gh` commands that support it. Private NanoClaw PRs target `jbaruch/nanoclaw`; plugin PRs target their own repository.
- For `gh api`, use an explicit repository path or GraphQL owner/name fields; that subcommand does not accept `--repo`.
- Apply this targeting rule to every repository, including forks. Never rely on GitHub CLI's parent-repository default.
- If a PR lands on the wrong repository, report the mistake and obtain authorization for any external comment or replacement PR outside the task's existing scope.
