# Browser Profile Storage

## Scope

- `jbaruch/nanoclaw` may persist website cookies, session storage and saved website passwords for its dedicated `visible-browser` service.
- Reuse approved website access autonomously across turns and restarts.
- API credentials remain in OneCLI.
- Website access grants no authority for unrelated actions on that website.

## Storage preconditions

- Keep the profile in the plain private folder `~/.local/state/nanoclaw-browser/profile`, mode 0700, outside the project tree.
- Mount it only into the dedicated non-agent browser service.
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

## Backup

- Exclude the profile from the ordinary group and git backup.
- A lost profile means signing in again; no recovery format exists.

## Native visible-browser lookup

- Host `jbaruch/nanoclaw` installs `container/visible-browser/validate-agent-cdp.mts` as `/usr/local/lib/nanoclaw/validate-visible-browser.mts` in the agent image.
- Invoke only `node /usr/local/lib/nanoclaw/validate-visible-browser.mts`; it takes no stdin or task-supplied endpoint.
- The host injects non-secret `VISIBLE_BROWSER_CDP_URL` only for main's private browser attachment; operators never set this capability variable in `.env`.
- Exit 0 emits only JSON `{"available":true}` and a newline; unavailable, substituted, malformed or headless results exit nonzero with empty stdout and an actionable redacted diagnostic.
- Preserve every access and retention constraint after this lookup; availability grants no owner identity or website action authority.
- Missing target or incompatible output requires repairing the installed image, never local-browser fallback or credential export.
- Regression coverage: `jbaruch/nanoclaw` `src/visible-browser-guard.test.ts`; native browser coverage also runs `container/visible-browser/smoke-test.sh`.
