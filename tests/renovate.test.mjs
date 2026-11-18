import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dependency PRs need no dashboard approval and stay capped at five", async () => {
  /** @type {{ prConcurrentLimit: number, dependencyDashboardApproval?: boolean, packageRules: { dependencyDashboardApproval?: boolean }[] }} */
  const config = JSON.parse(
    await readFile(new URL("../renovate.json", import.meta.url), "utf8"),
  );
  assert.equal(config.prConcurrentLimit, 5);
  assert.ok(!config.dependencyDashboardApproval);
  for (const rule of config.packageRules) {
    assert.ok(!rule.dependencyDashboardApproval);
  }
});

test("minor, patch and digest dependency updates share one PR", async () => {
  /** @type {{ packageRules: { matchUpdateTypes: string[], groupName?: string }[] }} */
  const config = JSON.parse(
    await readFile(new URL("../renovate.json", import.meta.url), "utf8"),
  );
  const groups = ["minor", "patch", "digest"].map((updateType) => {
    const rule = config.packageRules.find((rule) =>
      rule.matchUpdateTypes.includes(updateType),
    );
    assert.ok(rule?.groupName, `${updateType} updates need a PR group`);
    return rule.groupName;
  });
  assert.equal(new Set(groups).size, 1);
});
