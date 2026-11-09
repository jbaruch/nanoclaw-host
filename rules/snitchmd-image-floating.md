---
alwaysApply: true
---

# Snitchmd Reviewed Image

## Committed Default

- Declare the `fetch_markdown` renderer default in `jbaruch/nanoclaw` `src/ipc-handlers/ops-fetch.ts` as an immutable `syabro/snitchmd@sha256:<digest>` reference.
- A tag plus digest is also immutable; a tag alone is not.
- Change the pin only through a focused source PR with normal reviews and CI.
- Record official upstream manifest provenance and supported platforms beside the pin.
- Verify native fetch compatibility before deploying a changed image.
- Do not reject a dependency-scanner pin merely for being immutable.

## Renewal

- The maintainer checks official upstream image metadata monthly and after compatibility reports.
- Keep the existing pin until the replacement completes source review and native validation.
- Do not execute newly published upstream bytes solely from a mutable tag.
- Add automated renewal when the repository's dependency scanner supports the declaration.

## Deployment and Operator Configuration

- CI (`jbaruch/nanoclaw` `scripts/supply-chain-pins.test.ts`) requires exactly one immutable committed default.
- A missing, duplicated or non-digest default fails CI; a deploy ships only a commit that passed CI.
- The check does not read or change explicit `SNITCHMD_IMAGE` operator configuration.
- Keep that existing override separate from the source default; an IPC caller cannot select an image.
- Do not pull, retag, recreate a service or change operator configuration to satisfy a source check.

## Surface Sync

- Update this rule, the source default and renewal comment, the CI check, `docs/fetch-tools.md` and CHANGELOG together when the dependency contract changes.
- Keep `rules/snitchmd-image-floating.md` as the stable authority lookup path; its historical filename grants no floating exception.
