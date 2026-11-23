# Browser Profile Storage

## Scope

- `jbaruch/nanoclaw` may persist website cookies, session storage and saved website passwords in its dedicated browser. On the rack Mini, native signed-in Chrome runs on macOS and `visible-browser` is its private nginx relay.
- Reuse approved website access autonomously across turns and restarts.
- API credentials remain in OneCLI.
- Website access grants no authority for unrelated actions on that website.

## Storage preconditions

- On a legacy containerized deployment, keep the profile in the plain private folder `~/.local/state/nanoclaw-browser/profile`, mode 0700, outside the project tree. On the Mini, keep the dedicated Chrome user-data directory local to the operator account, mode 0700 and outside every checkout.
- Mount a containerized profile only into the dedicated non-agent browser service. Keep the rack Mini profile on macOS and outside all container mounts.
- Never mount it into an agent container or copy it into the project, a group folder, an image or a log.

## Access and retention

- Only the literal main-tier agent may control browser sessions through the private CDP bridge.
- Private operator viewing uses the existing approved device/identity path.
- Never expose CDP or enable Funnel.
- Browser autofill may reuse saved website credentials for an approved account and matching origin.
- Agents must not reveal, export or log passwords, cookies or storage tokens.
- CAPTCHA solving is operator-approved.
- MFA requires operator handoff.
- Retain approved sessions and saved passwords until the operator removes them or the website expires or revokes them.
- Never clear authentication on a recurring schedule or routine deployment.

## Rack Mini Operator Handoff

This approval applies to the operator-owned rack Mac mini hosting
`jbaruch/nanoclaw` in its Lima VM. The owner operates the existing
macOS account and NanoClaw's dedicated Chrome profile on the Mac.

1. Use the Mini's built-in macOS Screen Sharing server over the operator's
   existing private Tailnet. Connect directly from an existing approved device
   under the owner's control. The owner may use the macOS client or a client on
   an approved iPhone that supports direct authentication to the native server
   with the same macOS account. Choose a Standard session when the macOS client
   offers a session type. A client that needs a separate VNC password or a
   remote-access relay is ineligible.
2. The Mac account and device checks both apply. Use macOS account
   authentication with Screen Sharing restricted to the existing account.
   Leave the shared VNC password and unsolicited control requests disabled.
   Follow Storage Preconditions and Backup in this reference.
3. The handoff is for the human operator. Pass the site and the required step
   without account secrets. Pause browser control before the owner enters any
   credential, MFA code, passkey or payment details. The owner performs any
   irreversible confirmation only under its existing action approval. Resume
   on the owner's report and verify the visible account and requested result
   through the existing main-only bridge. Keep credential values, passkey
   dialogs, MFA material and payment details out of agent inputs and logs.
4. This approval supplies no agent or guest access to the Mac session, account,
   profile or Screen Sharing service. Keep CDP private under the existing
   bridge contract. Keep Screen Sharing off the public internet. Leave Funnel
   and general remote-access enrollment disabled.

### Current-State Acceptance

Verify the applicable published Host contract and deployed NanoClaw path. Use
current native configuration and the owner's approved devices as evidence.

- Bind the actual Mini and each selected source device to their native Tailnet
  identities. Verify the native Screen Sharing listener on TCP 5900. Read the
  complete effective ACL and grants for that port, including overlapping
  allows. Confirm only the selected devices can use this path. Confirm the
  service has no internet publication or router
  forwarding and that agent and guest networks have no path to it.
- Read the native Screen Sharing settings and evaluate effective account
  access, expanding groups. Confirm the existing owner is the only interactive
  account admitted. Verify the shared VNC password and unsolicited control
  requests are disabled. Confirm the approved device reaches the expected
  existing Chrome session through the Tailnet with
  macOS account authentication. An iPhone client needs its own observed pass
  before the handoff uses it.
- Observe one real operator takeover and follow-up verification. Verify that
  effective Tailnet access, publication settings, and guest/agent network
  policy exclude those paths. Verify that the browser profile and CDP exposure still
  meet their private boundaries. No source branch, fixture, endpoint label, or
  caller role can stand in for a live result.
- Record the published contract version, deployed commit, date, and acceptance
  outcomes. Keep native identities and addresses in private operator evidence.
  Keep credential input, browser contents and unredacted configuration out of
  shared evidence. Recheck after a change to the approved source device,
  Tailnet policy, macOS account or screen-sharing settings, or browser exposure.
  Pause the handoff when the current evidence is missing or any check fails.

Every other deployment uses its existing approved device and identity path.

## Backup

- Exclude the entire profile from every backup, including ordinary Time Machine, encrypted backups and group archives. Keep it out of every Git repository, including private ones.
- Verify the Time Machine exclusion on the Mini before relying on authenticated persistence. Keep the local path in private operator evidence.
- After profile loss the operator signs in again. Never back up or export credentials, cookies or session material for recovery.

## Native visible-browser lookup

- Host `jbaruch/nanoclaw` installs `container/visible-browser/validate-agent-cdp.mts` as `/usr/local/lib/nanoclaw/validate-visible-browser.mts` in the agent image.
- Invoke only `node /usr/local/lib/nanoclaw/validate-visible-browser.mts`; it takes no stdin or task-supplied endpoint.
- The host injects non-secret `VISIBLE_BROWSER_CDP_URL` only for main's private browser attachment; operators never set this capability variable in `.env`.
- Exit 0 emits only JSON `{"available":true}` and a newline; unavailable, substituted, malformed or headless results exit nonzero with empty stdout and an actionable redacted diagnostic.
- Preserve every access and retention constraint after this lookup; availability grants no owner identity or website action authority.
- Missing target or incompatible output requires repairing the installed image, never local-browser fallback or credential export.

## Browser CI

- On every consumer PR, retain the native agent validator checks in `src/visible-browser-guard.test.ts`, including fixed-endpoint discovery, success output and redacted refusal. Keep the main-only network and capability injection checks in `src/visible-browser.test.ts`.
- Until the reviewed Mini cutover, also build the dedicated Chromium image and run `container/visible-browser/smoke-test.sh`. Require sandboxed visible startup, private CDP isolation, noVNC health and synthetic profile persistence across restart.
- At cutover replace that image smoke with a deterministic relay test. Use the nginx image digest and startup settings from `docker-compose.yml` and the actual `container/visible-browser/nginx.conf`. Validate the configuration with `nginx -t` and start that configuration under the service's unprivileged, read-only settings.
- In an isolated disposable network, place a synthetic endpoint at the configured upstream so the test can run the shipped config unchanged. Serve discovery JSON containing the upstream address and echo a WebSocket frame. Through the running relay, request `/json/version` and assert that `webSocketDebuggerUrl` rewrites the upstream authority to `visible-browser:9222` and preserves the path (for example, `/devtools/browser/fixture-id`).
- Connect to the returned URL. Require a successful WebSocket upgrade (HTTP 101), send a known payload and verify the echoed frame. Fail CI on startup, rewrite, upgrade or round-trip failure. Config-string assertions alone cannot pass this gate.
- Use no signed-in profile, live browser, real CDP endpoint, host LAN or credentials in the relay test. Keep the real-device Screen Sharing acceptance separate.
