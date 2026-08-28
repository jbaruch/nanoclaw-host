---
alwaysApply: true
---

# Post-Merge Publish Watch

## A merge is not a ship

Merging a plugin-repo PR does not publish it. Registry publication is a separate gate.

- Ship a plugin repo through `coding-policy` `Skill(skill: "release")`, invoked BEFORE the merge.
- Merging outside that skill: run `skills/release/capture-registry-baseline.sh` before the merge.
- Never hand-roll a `gh run list` watch in place of the contract (`coding-policy: script-as-black-box`).
- Pass `--repo` on every `gh` invocation (`nanoclaw-host: repo-chain`).
- Report a plugin shipped only when the release contract's conjunction is confirmed (`coding-policy: ci-safety`).

## Pass the workflow FILE, never its display name

- Pass `publish.yml` as `skills/release/resolve-publish-run.sh`'s `<workflow>` argument:

  ```bash
  skills/release/resolve-publish-run.sh jbaruch <plugin-repo> "$merge_sha" publish.yml
  ```

- Never pass a display name.
- Confirm the filename on a repo outside the `nanoclaw*` set with `gh workflow list --repo jbaruch/<repo> --json name,path`.

## An unresolved run is never a passed one

On a non-zero exit from `skills/release/resolve-publish-run.sh`:

- Fix the identifier.
- Re-run the resolver.
- Never read that exit as "nothing to publish".
- Never proceed to the conjunction on it.
