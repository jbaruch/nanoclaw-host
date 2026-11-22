# Browser Tailnet Viewer

## Scope and implementation

This contract covers only NanoClaw's dedicated noVNC Tailscale viewer node.
It grants no website, payment, messaging, Google, vehicle or agent role authority.
The rack Mini native Screen Sharing handoff follows the Rack Mini Operator
Handoff section of `skills/host-contracts/references/browser-profile-storage.md`.
Only the actual host operator may enroll the node. A source branch, test fixture,
TTY, copied JSON or caller `isMain` value never proves native acceptance.

The reviewed Core owner consists of `container/browser-viewer/entrypoint.sh`,
`setup/browser-tailnet-viewer.ts`, `scripts/browser-viewer.sh`, their tests and
canonical Compose/deploy wiring. Its complete operator procedure is
`jbaruch/nanoclaw:docs/BROWSER-VIEWER.md`; bind the deployed commit and installed
Host contract before relying on it. The operator helper uses fixed native
service/ID/image selection and first-party Tailscale CLI, never a credential API.

## Native-state credential exception

Narrow exception for first-party Tailscale node identity and ACME state.
Applies only to the dedicated `nanoclaw-browser-viewer` service.
Preconditions, all required:

1. Enroll through normal Tailscale SSO from the actual operator's private TTY.
   Require owner authentication and verify the selected native node before
   approval. Supply no TS_AUTHKEY, OAuth/control token, password or OneCLI export.
2. Before opt-in or enrollment, verify actual tag ownership, HTTPS availability
   and complete effective ACL/grants. Only the two selected owner devices may
   reach this node on TCP 443. Bind native device IDs to their exact addresses.
   Deny every other TCP/UDP port and every unselected device; broader existing
   allows are blockers. Preserve other tailnet resources. Never tag human devices.
3. Retain only first-party-generated native node/ACME state at the host's resolved
   `$HOME/.local/state/nanoclaw-browser-viewer/tailscale`, outside checkout,
   backups and agent/group mounts. Its enclosing directories are 0700; files are
   0600, single-link and owned by actual configured non-root HOST_UID:HOST_GID.
   Only public `certs/<own-node>.crt` may be 0644 inside 0700. Refuse aliases,
   foreign inputs and unknown root leaves; do not repair or reuse another node.
4. Run a reviewed pinned userspace daemon, read-only root, dropped capabilities,
   no TUN, profile/key/group/agent/Docker-socket mounts or forward proxies. Keep
   noVNC bound to 127.0.0.1:6080 and CDP unpublished. Userspace host networking can
   forward other allowed ports to loopback; Serve alone is not a firewall.
5. Keep enrollment output in the operator TTY, never captured/model/shared logs.
   Disable persistent container logging and daemon telemetry. Native status/Serve
   metadata may use disposable private 0700/0600 slots, removed after projection;
   never copy raw credential state or use credential-bearing debug dumps.
6. Fixed enrollment clears routes, exit-node selection/advertisement and SSH,
   resets only this node's Serve, then sets tailnet-only HTTPS 443 to loopback 6080.
   Verify native online identity and exact Serve/Funnel-off readback. Failure or
   cancellation stops only the bound viewer ID and retains state for inspection;
   no automatic retry, key reset, policy widening or browser lifecycle change.
7. Routine canonical deployment reuses native state and background Serve.
   Full deployment with opt-in 0 stops only viewer; tiles-only leaves lifecycle
   unchanged. On retirement, stop viewer through canonical deployment, revoke the
   exact node in the real control plane, then retire only its verified private
   state. Unknown/revoked/expired identity holds for inspection; never erase state
   to induce re-enrollment. Verify node expiry and revoke retired device selectors.

Every other credential follows `rules/host-conventions.md` and OneCLI policy.
This exception creates no secret-materialization API or general state-cache grant.

## Platform-Bound Untestable Carve-Out

Narrow exception under `coding-policy: testing-standards` for the following finite
external-runtime interaction classes, limited to their smallest invocation layer:

1. Actual owner SSO/device approval of the new Tailscale node. Exempt only the
   live authentication interaction entered by `scripts/browser-viewer.sh enroll`'s
   fixed interactive `tailscale up`; parsing, TTY refusal, command ordering,
   identity binding, readback and failure cleanup remain CI tested.
2. Actual tailnet control-plane effective policy, tag ownership, HTTPS and
   owner-device membership. Exempt only native control-plane observation and
   operator approval; source never invents a grant or treats fake metadata as proof.
3. Real off-home phone/laptop Tailscale-app HTTPS/WebSocket access, independent
   denied-device/off-tailnet access and post-restart native identity persistence.
   Exempt only those real-device/network interactions; native startup and private
   filesystem behavior remain executable in CI.

Manual validation for class1: verify source/image/installed authority and the
complete class2 policy first. Start only via approved canonical deployment.
Use actual operator private TTY, authenticate normal SSO, inspect native node
ID/name/tag/owner, then require exact online Serve443/loopback 6080/Funnel-off
readback. Preserve unknown state and stop the bound viewer on failure.

Manual validation for class2: retain private metadata proving selected phone,
laptop and denied-device IDs/addresses, complete effective policy/tag owners,
HTTPS, no routes/exit-node/SSH/Funnel and accept/deny tests. No broader allow may
reach this destination. No API credential, raw state, PIN or enrollment link
enters shared evidence.

Manual validation for class3: off-home phone AND laptop each load the real noVNC
HTTPS page and establish wss `/websockify`, HTTP 101 and a live frame. An HTML 200
alone fails. The unselected tailnet device fails page AND WebSocket; owner devices
cannot reach other ports. Off-tailnet access fails with native Funnel absent and
no exposed 6080/9222. Recreate/restart only through canonical deployment and repeat
same node ID/URL plus allowed/denied page and WebSocket checks. Record source,
installed-contract/native IDs and booleans, never account content or credentials.

Every other interaction follows testing-standards in full. Mandatory deterministic
CI covers the real pinned offline unprivileged image/daemon startup, native CLI
refusal and private-state modes, shell diagnostics, metadata/Serve projection,
TTY/non-TTY outcomes, fixed native arguments, stop-on-failure and unchanged browser
exposure. No manual exception excuses missing source/image tests. The published
Host authority and actual native reference read are required before activation.
