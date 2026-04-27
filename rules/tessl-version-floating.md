# Tessl Version Pin Drift

## Pins are correct — the drift is the bug

Per `jbaruch/coding-policy: dependency-management`, dependency manifests should pin versions or commit a lock file for reproducibility. `tessl-workspace/tessl.json` follows the pin form: each `dependencies.<tile>.version` is a literal `0.1.x` string. That part is right; **don't switch the pins to `"latest"` or any floating range** — `tessl install` resolves the floating spec at runtime to whatever's currently on the registry, and `.tessl/tiles/<tile>/tile.json` (where the resolved version would otherwise be recorded) is gitignored. Floating manifest + ignored lock = no lock at all, which the dependency-management rule explicitly disallows.

The actual bug is downstream of the pins: **`tessl update` rewrites the manifest in-place, but nothing commits the resulting bump.**

## How the drift happens

The orchestrator's `/app/tessl-workspace/tessl.json` is bind-mounted from the host repo's `tessl-workspace/tessl.json`. Three independent flows trigger `tessl update`:

1. `scripts/deploy.sh` step 3 (every deploy).
2. The orchestrator's 15-minute periodic catch-up loop (`src/index.ts`).
3. The `tessl_update` MCP tool (called from the agent after a promote).

Each flow writes the new pins back to the bind-mounted file. The host repo's working tree shows the modified manifest, but no automation commits it. A subsequent `git pull` (or fresh clone + container rebuild) overwrites the in-place bumps with whatever pins were last hand-committed — silently rolling tile content backward across the fleet.

Verified on 2026-04-27: NAS working tree was 22 days behind `main` on every tile (e.g. `nanoclaw-core` 0.1.60 in git → 0.1.87 actual; `nanoclaw-admin` 0.1.101 → 0.1.229; `nanoclaw-host` 0.1.2 → 0.1.23).

## Fix: auto-commit + push the bump after every successful `tessl update`

Each of the three `tessl update` callers MUST, on success, check whether `tessl-workspace/tessl.json` has a working-tree diff against `HEAD` and — if so — commit and push the bump. Skeleton:

```bash
if ! git diff --quiet tessl-workspace/tessl.json; then
  git add tessl-workspace/tessl.json
  git -c user.email="$BOT_EMAIL" -c user.name="$BOT_NAME" commit \
    -m "chore(tessl): bump tile pins from registry [skip ci]"
  git push origin main
fi
```

The `[skip ci]` tag is intentional — the bump itself doesn't need CI; the next promote PR will re-trigger the full gate. The push runs against `main` because the bump is a fact about what the orchestrator is actually running, not a proposal for review.

## Verification

After landing the auto-commit:

- `git log --oneline -- tessl-workspace/tessl.json | head` should show regular `chore(tessl): bump tile pins` commits, one per registry-published tile version.
- `ssh nas 'cd /home/jbaruch/nanoclaw && git status tessl-workspace/tessl.json'` should report "clean" between deploys (or briefly show a diff that the next `tessl update` resolves).

## Don't add lock-file workarounds

Keep `.tessl/tiles/` gitignored. Don't try to repurpose it as a manifest. The pin in `tessl.json` IS the source of truth; the bind-mount + auto-commit flow keeps it accurate.
