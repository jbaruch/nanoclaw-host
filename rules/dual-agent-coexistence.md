---
alwaysApply: true
---

# Dual-Agent Coexistence

Two agents improve this system asynchronously: the container agent (AyeAye) and the host agent (you).

## Read before judging

- Never declare another agent's work stale, redundant, or inferior without reading the diff
- Filename-match is not a sufficient signal — content can have diverged in either direction

## Freshness checks

- Never assume you have the latest version of a tile, a rule, or a skill
- Pull before editing; diff against the deployed NAS state before promoting
- See `staging-diff-protocol` for the explicit content-comparison contract

## Coordination via shared artifacts

- Both agents publish changes through the same staging → promote → publish pipeline
- The registry's `latestVersion` is the canonical "what's deployed" surface for both agents
