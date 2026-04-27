---
alwaysApply: true
---

# Tessl Version Pin Drift

## Pins are correct — the drift is the bug

Per `jbaruch/coding-policy: dependency-management`, dependency manifests should pin versions or commit a lock file for reproducibility. `tessl-workspace/tessl.json` follows the pin form: each `dependencies.<tile>.version` is a literal `0.1.x` string. That part is right; **don't switch the pins to `"latest"` or any floating range** — `tessl install` resolves the floating spec at runtime to whatever's currently on the registry, and `.tessl/tiles/<tile>/tile.json` (where the resolved version would otherwise be recorded) is gitignored. Floating manifest + ignored lock = no lock at all, which the dependency-management rule explicitly disallows.

The actual bug is downstream of the pins: **`tessl update` rewrites the manifest in-place, but nothing surfaces the resulting bump to git.**

## How the drift happens

The orchestrator's `/app/tessl-workspace/tessl.json` is bind-mounted from the host repo's `tessl-workspace/tessl.json`. Three independent flows trigger `tessl update`:

1. `scripts/deploy.sh` step 3 (every deploy).
2. The orchestrator's 15-minute periodic catch-up loop (`src/index.ts`).
3. The `tessl_update` MCP tool (called from the agent after a promote).

Each flow writes the new pins back to the bind-mounted file. The host repo's working tree shows the modified manifest, but no automation surfaces it. A subsequent `git pull` (or fresh clone + container rebuild) overwrites the in-place bumps with whatever pins were last hand-committed — silently rolling tile content backward across the fleet.

Verified on 2026-04-27: NAS working tree was 22 days behind `main` on every tile (e.g. `nanoclaw-core` 0.1.60 in git → 0.1.87 actual; `nanoclaw-admin` 0.1.101 → 0.1.229; `nanoclaw-host` 0.1.2 → 0.1.23).

## Fix: surface the bump via a PR, NOT a direct push

Each `tessl update` caller MUST, on success, check whether `tessl-workspace/tessl.json` has a working-tree diff against `HEAD` and — if so — open a pull request with the bump on a `chore/tessl-pin-bump-<utc>` branch. Skeleton:

```bash
# `git diff HEAD --quiet -- <path>` compares working tree against
# HEAD (not against the index), so a `git add` between the update
# and this check doesn't mask the diff. Per `coding-policy: ci-safety`
# branch names must be lowercase + hyphens, so the timestamp uses
# epoch seconds (numeric only) plus a 4-hex random suffix to avoid
# collision when two callers bump in the same second.
if ! git diff HEAD --quiet -- tessl-workspace/tessl.json; then
  branch="chore/tessl-pin-bump-$(date -u +%s)-$(printf '%04x' $((RANDOM * RANDOM & 0xffff)))"
  git checkout -b "$branch"
  git add tessl-workspace/tessl.json
  git -c user.email="$BOT_EMAIL" -c user.name="$BOT_NAME" commit \
    -m "chore(tessl): bump tile pins from registry"
  git push -u origin "$branch"
  gh pr create --repo jbaruch/nanoclaw --base main --head "$branch" \
    --title "chore(tessl): bump tile pins from registry" \
    --body "Auto-opened by <caller-name> after a tessl update bumped the pins. Diff is mechanical — every \`dependencies.<tile>.version\` field is the version tessl resolved against the registry. Merge once CI is green."
fi
```

`coding-policy: ci-safety` is non-negotiable: don't push to `main` directly, don't add `[skip ci]`. The pin-bump PR is small, fast through CI, and auto-mergeable once green — the cost of routing through review is one extra review cycle, which is the right price for keeping branch protections intact.

For human-driven bumps (operator runs `tessl update` locally after a deploy), the same rule applies: open a PR with the bump rather than committing to `main`.

## Verification

After landing the auto-PR mechanism in all three callers:

- `gh pr list --repo jbaruch/nanoclaw --search "chore(tessl): bump tile pins"` should show regular automated PRs, one per registry-published tile version.
- `ssh nas 'cd /home/jbaruch/nanoclaw && git status tessl-workspace/tessl.json'` should report "clean" between deploys (or briefly show a diff that the next `tessl update` flow's PR captures).

## Don't add lock-file workarounds

Keep `.tessl/tiles/` gitignored. Don't try to repurpose it as a manifest. The pin in `tessl.json` IS the source of truth; the bind-mount + auto-PR flow keeps it accurate.
