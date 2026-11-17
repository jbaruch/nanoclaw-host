import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
