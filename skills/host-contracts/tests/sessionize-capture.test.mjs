import { test } from "node:test";
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import vm from "node:vm";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { capture } from "../scripts/sessionize-capture.mjs";

const PAGE = "https://sessionize.com/app/speaker/events";
/** @param {string} tag @param {string} [text] @param {Record<string,any>} [attributes] @param {any[]} [children] */
function element(tag, text = "", attributes = {}, children = []) {
  return {
    tagName: tag,
    namespaceURI:
      tag === tag.toUpperCase()
        ? "http://www.w3.org/1999/xhtml"
        : "http://www.w3.org/2000/svg",
    className: attributes.class ?? "",
    childNodes: text ? [{ nodeType: 3, textContent: text }] : [],
    children,
    hasAttribute: (/** @type {string} */ name) => name in attributes,
    getAttribute: (/** @type {string} */ name) => attributes[name] ?? null,
    getClientRects: () => (attributes.rendered === false ? [] : [{}]),
    checkVisibility: (/** @type {CheckVisibilityOptions} */ options) => {
      assert.equal(options.contentVisibilityAuto, true);
      return (
        attributes.autoSkippedAncestor !== true && attributes.rendered !== false
      );
    },
    style: attributes.style ?? {},
  };
}
/** @param {import('node:test').TestContext} t @param {Record<string,any>} [options] */
function fixture(t, options = {}) {
  /** @type {Record<string,any>[]} */ const calls = [];
  /** @type {any[][]} */ const validators = [];
  t.mock.method(
    childProcess,
    "execFileSync",
    (/** @type {any[]} */ ...args) => {
      validators.push(args);
      if (options.validatorFailure)
        throw Object.assign(new Error("PRIVATE_VALIDATOR"), { status: 1 });
      return options.validatorOutput ?? '{"available":true}\n';
    },
  );
  t.mock.timers.enable({ apis: ["Date"], now: 1_577_836_800_000 });
  const targets = options.targets ?? [
    {
      targetId: "synthetic-target",
      type: "page",
      url: "https://sessionize.com/",
      browserContextId: "default",
    },
  ];
  const frame = options.beforeFrame ?? {
    id: options.distinctFrame ? "synthetic-frame" : "synthetic-target",
    url: "https://sessionize.com/",
    loaderId: "synthetic-loader",
    securityOrigin: "https://sessionize.com",
  };
  const tree =
    options.tree ??
    element(
      "BODY",
      "",
      [],
      [
        element("H1", "My events"),
        element("SPAN", "Synthetic speaker", { class: "event-title" }),
        element("A", "Example event", {
          href: "/app/speaker/event/details/4242",
        }),
        element("A", "Synthetic talk", {
          href: "/app/speaker/session/native_42",
        }),
      ],
    );
  let frames = 0,
    infos = 0,
    closed = 0,
    evaluated = 0;
  const original = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
  class FakeSocket extends EventTarget {
    static OPEN = 1;
    static CLOSED = 3;
    readyState = 0;
    constructor(/** @type {string} */ endpoint) {
      super();
      assert.equal(
        endpoint,
        "ws://visible-browser:9222/devtools/browser/synthetic-browser",
      );
      queueMicrotask(() => {
        this.readyState = 1;
        this.dispatchEvent(new Event("open"));
      });
    }
    send(/** @type {string} */ text) {
      const request = JSON.parse(text);
      calls.push(request);
      let result;
      if (request.method === "Target.getTargets")
        result = { targetInfos: targets };
      else if (request.method === "Target.getTargetInfo") {
        infos++;
        result = {
          targetInfo:
            infos === 2 && options.afterTarget
              ? options.afterTarget
              : targets[0],
        };
      } else if (request.method === "Target.attachToTarget")
        result = { sessionId: "synthetic-session" };
      else if (request.method === "Page.getFrameTree") {
        frames++;
        result = {
          frameTree: {
            frame:
              frames === 2 && options.afterFrame ? options.afterFrame : frame,
          },
        };
      } else if (request.method === "Page.createIsolatedWorld")
        result = { executionContextId: 17 };
      else if (request.method === "Runtime.evaluate") {
        evaluated++;
        assert.equal(request.sessionId, "synthetic-session");
        assert.equal(request.params.contextId, 17);
        try {
          const value = vm.runInNewContext(request.params.expression, {
            location: {
              href:
                evaluated === 2 && options.changedRoute
                  ? "https://sessionize.com/app/speaker/other"
                  : PAGE,
              origin: "https://sessionize.com",
              pathname: "/app/speaker/events",
            },
            document: {
              readyState: options.loading ? "loading" : "complete",
              visibilityState: options.background ? "hidden" : "visible",
              title: "My events",
              body: tree,
            },
            performance: {
              timeOrigin:
                evaluated === 2 && options.changedTimeOrigin ? 456 : 123,
            },
            Node: { TEXT_NODE: 3 },
            URL,
            getComputedStyle: (/** @type {any} */ e) => {
              const style = {
                visibility: "visible",
                display: "block",
                opacity: "1",
                fontSize: "16px",
                color: "rgb(0, 0, 0)",
                fill: "rgb(0, 0, 0)",
                fillOpacity: "1",
                stroke: "none",
                textShadow: "none",
                webkitTextStrokeWidth: "0px",
                ...e.style,
              };
              return { webkitTextFillColor: style.color, ...style };
            },
          });
          result = {
            result: {
              value:
                options.resultOverride !== undefined && evaluated === 1
                  ? { capture: options.resultOverride, timeOrigin: 123 }
                  : value,
            },
          };
        } catch (error) {
          assert.ok(
            error instanceof Error ||
              Object.prototype.toString.call(error) === "[object Error]",
          );
          result = { exceptionDetails: { text: "PRIVATE_NATIVE_EXCEPTION" } };
        }
      } else if (request.method === "Target.detachFromTarget") result = {};
      else assert.fail("Unexpected protocol action: " + request.method);
      const error =
        request.method === options.failMethod
          ? { code: -32000, message: "PRIVATE_NATIVE_PROTOCOL" }
          : undefined;
      queueMicrotask(() =>
        this.dispatchEvent(
          new MessageEvent("message", {
            data: JSON.stringify({
              id: request.id,
              ...(request.sessionId
                ? {
                    sessionId: options.wrongSession
                      ? "foreign-session"
                      : request.sessionId,
                  }
                : {}),
              ...(error ? { error } : { result }),
            }),
          }),
        ),
      );
    }
    close() {
      closed++;
      this.readyState = 3;
      this.dispatchEvent(new Event("close"));
    }
  }
  Object.defineProperty(globalThis, "WebSocket", {
    value: FakeSocket,
    configurable: true,
    writable: true,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "WebSocket", original);
  });
  t.mock.method(
    globalThis,
    "fetch",
    async (
      /** @type {RequestInfo|URL} */ url,
      /** @type {RequestInit|undefined} */ init,
    ) => {
      assert.equal(url, "http://visible-browser:9222/json/version");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.credentials, "omit");
      assert.equal(init?.method, "GET");
      return new Response(
        JSON.stringify({
          webSocketDebuggerUrl:
            options.ws ??
            "ws://visible-browser:9222/devtools/browser/synthetic-browser",
        }),
        { status: options.discoveryStatus ?? 200 },
      );
    },
  );
  return {
    calls,
    validators,
    closed: () => closed,
    evaluated: () => evaluated,
  };
}

test("exact no-argument validator, fixed bridge, isolated read and own-session cleanup", async (t) => {
  const f = fixture(t);
  const result = await capture();
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    schema_version: 1,
    source: "sessionize",
    observed_at: "2020-01-01T00:00:00.000Z",
    capture: {
      schema_version: 1,
      origin: "https://sessionize.com",
      path: "/app/speaker/events",
      title: "My events",
      nodes: [
        { tag: "BODY", parent: null, classes: "", text: "" },
        { tag: "H1", parent: 0, classes: "", text: "My events" },
        {
          tag: "SPAN",
          parent: 0,
          classes: "event-title",
          text: "Synthetic speaker",
        },
        {
          tag: "A",
          parent: 0,
          classes: "",
          text: "Example event",
          href: "https://sessionize.com/app/speaker/event/details/4242",
        },
        {
          tag: "A",
          parent: 0,
          classes: "",
          text: "Synthetic talk",
          href: "https://sessionize.com/app/speaker/session/native_42",
        },
      ],
      scope: result.capture.scope,
    },
  });
  assert.equal(f.validators.length, 1);
  assert.equal(f.validators[0][0], "node");
  assert.deepEqual(f.validators[0][1], [
    "/usr/local/lib/nanoclaw/validate-visible-browser.mts",
  ]);
  assert.deepEqual(
    f.calls.map((r) => r.method),
    [
      "Target.getTargets",
      "Target.getTargetInfo",
      "Target.attachToTarget",
      "Page.getFrameTree",
      "Page.createIsolatedWorld",
      "Runtime.evaluate",
      "Runtime.evaluate",
      "Page.getFrameTree",
      "Target.getTargetInfo",
      "Target.detachFromTarget",
    ],
  );
  assert.deepEqual(f.calls.at(-1)?.params, { sessionId: "synthetic-session" });
  assert.equal(f.closed(), 1);
});

for (const [name, options] of Object.entries({
  projected: { projected: true },
  distinctRootFrame: { projected: true, distinctFrame: true },
  backgroundDocument: { projected: true, background: true },
}))
  test(`captures ${name} through projected metadata without activation`, async (t) => {
    const f = fixture(t, options);
    const output = await capture();
    assert.equal(output.capture.nodes.length, 5);
    assert.ok(
      !f.calls.some((r) =>
        /activate|bringToFront|navigate|createTarget/.test(r.method),
      ),
    );
    assert.equal(f.closed(), 1);
  });

test("refuses unprojected raw-CDP document URLs instead of adopting another endpoint contract", async (t) => {
  const f = fixture(t, {
    targets: [
      {
        targetId: "synthetic-target",
        type: "page",
        url: PAGE,
        browserContextId: "default",
      },
    ],
    beforeFrame: {
      id: "synthetic-target",
      url: PAGE,
      loaderId: "synthetic-loader",
      securityOrigin: "https://sessionize.com",
    },
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
  assert.equal(f.evaluated(), 0);
  assert.equal(f.closed(), 1);
});

test("omits hidden/form values and unsafe URLs without laundering query or fragment", async (t) => {
  const unsafe = [
    "/app/speaker/session/42?token=secret",
    "/app/speaker/session/42#bearer",
    "/app/speaker/session/42/edit",
    "https://other.invalid/app/speaker/session/42",
    "javascript:bad()",
  ];
  const tree = element(
    "BODY",
    "direct",
    [],
    [
      element("DIV", "nested", [], [element("SPAN", "child")]),
      element("INPUT", "PRIVATE_INPUT"),
      element("FORM", "PRIVATE_FORM", [], [element("DIV", "PRIVATE_CHILD")]),
      element("SPAN", "PRIVATE_HIDDEN", { hidden: true }),
      element("SPAN", "PRIVATE_CSS", { style: { visibility: "hidden" } }),
      ...unsafe.map((href) => element("A", "link", { href })),
    ],
  );
  fixture(t, { tree });
  const result = await capture();
  assert.equal(result.capture.nodes[0].text, "direct");
  assert.equal(result.capture.nodes[1].text, "nested");
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false);
  const links = result.capture.nodes.filter(
    (/** @type {any} */ n) => n.tag === "A",
  );
  assert.equal(links.length, unsafe.length);
  assert.ok(
    links.every(
      (/** @type {any} */ n) => n.link_omitted === true && !("href" in n),
    ),
  );
});

for (const [name, options] of Object.entries({
  missing: { targets: [] },
  ambiguous: {
    targets: [
      {
        targetId: "synthetic-one",
        type: "page",
        url: "https://sessionize.com/",
        browserContextId: "default",
      },
      {
        targetId: "synthetic-two",
        type: "page",
        url: "https://sessionize.com/",
        browserContextId: "default",
      },
    ],
  },
  changedTarget: {
    afterTarget: {
      targetId: "other",
      type: "page",
      url: "https://sessionize.com/",
      browserContextId: "default",
    },
  },
  changedContext: {
    afterTarget: {
      targetId: "synthetic-target",
      type: "page",
      url: "https://sessionize.com/",
      browserContextId: "other",
    },
  },
  changedDocument: {
    afterFrame: {
      id: "synthetic-target",
      url: "https://sessionize.com/",
      loaderId: "changed",
      securityOrigin: "https://sessionize.com",
    },
  },
  emptyFrame: {
    beforeFrame: {
      id: "synthetic-target",
      url: "",
      loaderId: "synthetic-loader",
      securityOrigin: "https://sessionize.com",
    },
  },
  errorFrame: {
    beforeFrame: {
      id: "synthetic-target",
      url: "https://sessionize.com/",
      loaderId: "synthetic-loader",
      securityOrigin: "https://sessionize.com",
      unreachableUrl: PAGE,
    },
  },
  foreignOrigin: {
    beforeFrame: {
      id: "synthetic-target",
      url: "https://sessionize.com/",
      loaderId: "synthetic-loader",
      securityOrigin: "https://other.invalid",
    },
  },
  wrongSession: { wrongSession: true },
  changedRoute: { changedRoute: true },
  changedTimeOrigin: { changedTimeOrigin: true },
  loading: { loading: true },
  validatorShape: { validatorOutput: '{"available":true,"extra":true}\n' },
  discovery: { discoveryStatus: 503 },
  wrongEndpoint: {
    ws: "ws://localhost:9222/devtools/browser/synthetic-browser",
  },
  malformedCapture: {
    resultOverride: {
      schema_version: 1,
      origin: "https://sessionize.com",
      path: "/app/speaker/events",
      title: "My events",
      nodes: [{ tag: "DIV", parent: 1, classes: "", text: "wrong" }],
    },
  },
  nativeRead: { failMethod: "Runtime.evaluate" },
  detach: { failMethod: "Target.detachFromTarget" },
}))
  test(`holds ${name} without website actions`, async (t) => {
    const f = fixture(t, options);
    await assert.rejects(capture(), /Sessionize capture unavailable/);
    assert.ok(
      !f.calls.some((r) =>
        /createTarget|closeTarget|navigate|activate|Cookie|Storage|Input/.test(
          r.method,
        ),
      ),
    );
    if (f.evaluated())
      assert.equal(f.calls.at(-1)?.method, "Target.detachFromTarget");
    if (f.calls.length) assert.equal(f.closed(), 1);
  });

test("validator failure cannot open a browser or disclose child stderr", async (t) => {
  const f = fixture(t, { validatorFailure: true });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
  assert.equal(f.calls.length, 0);
});

test("no caller selectors accepted", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    Reflect.apply(capture, undefined, [{ endpoint: "http://other.invalid" }]),
    /Sessionize capture unavailable/,
  );
  assert.equal(f.validators.length, 0);
  assert.equal(f.calls.length, 0);
});

test("node and text bounds hold without truncation", async (t) => {
  fixture(t, {
    tree: element(
      "BODY",
      "",
      {},
      Array.from({ length: 12_000 }, () => element("DIV", "bounded")),
    ),
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
});

test("verified module bytes can run without reopening a plugin path", async (t) => {
  const source = await readFile(
    new URL("../scripts/sessionize-capture.mjs", import.meta.url),
    "utf8",
  );
  const copied = await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
  const f = fixture(t);
  const output = await copied.capture();
  assert.equal(output.source, "sessionize");
  assert.equal(output.capture.nodes.length, 5);
  assert.equal(f.closed(), 1);
});

test("CLI selector arguments refuse before native validator execution", () => {
  const result = childProcess.spawnSync(
    process.execPath,
    [
      new URL("../scripts/sessionize-capture.mjs", import.meta.url).pathname,
      "--endpoint=http://other.invalid",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Sessionize capture unavailable/);
  assert.equal(result.stderr.includes("other.invalid"), false);
});

test("symlinked CLI invocation refuses selectors instead of silently exiting successfully", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "sessionize-cli-"));
  t.after(() => rm(directory, { recursive: true }));
  const alias = join(directory, "capture.mjs");
  await symlink(
    new URL("../scripts/sessionize-capture.mjs", import.meta.url),
    alias,
  );
  const result = childProcess.spawnSync(
    process.execPath,
    [alias, "--endpoint=http://other.invalid"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Sessionize capture unavailable/);
  assert.equal(result.stderr.includes("other.invalid"), false);
});

test("retains rendered foreign-namespace SVG tag casing without refusing HTML capture", async (t) => {
  fixture(t, {
    tree: element("BODY", "visible page", {}, [
      element("svg", "", {}, [element("path")]),
    ]),
  });
  const output = await capture();
  assert.deepEqual(
    output.capture.nodes.map((/** @type {any} */ n) => n.tag),
    ["BODY", "svg", "path"],
  );
});

test("foreign-namespace privacy classification excludes lowercase sensitive subtrees and unsafe anchors", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element("svg", "", {}, [
        ...["script", "style", "input", "form"].map((tag) =>
          element(tag, "PRIVATE_FOREIGN_WITNESS", {}, [
            element("tspan", "PRIVATE_FOREIGN_CHILD"),
          ]),
        ),
        element("tspan", "visible-svg"),
        element("a", "unsafe", {
          href: "/app/speaker/session/42?private=bearer",
        }),
      ]),
    ]),
  });
  const output = await capture();
  assert.equal(JSON.stringify(output).includes("PRIVATE_FOREIGN"), false);
  assert.equal(JSON.stringify(output).includes("private=bearer"), false);
  assert.ok(
    output.capture.nodes.some(
      (/** @type {any} */ n) => n.tag === "tspan" && n.text === "visible-svg",
    ),
  );
  const anchor = output.capture.nodes.find(
    (/** @type {any} */ n) => n.tag === "a",
  );
  assert.equal(anchor.link_omitted, true);
  assert.equal("href" in anchor, false);
});

test("retains boxless display-contents text and visible descendants with their DOM parents", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "visible direct text",
        { rendered: false, style: { display: "contents" } },
        [
          element("SPAN", "visible descendant", { class: "session-status_0" }),
          element("FORM", "PRIVATE_FORM", { style: { display: "contents" } }, [
            element("SPAN", "PRIVATE_FORM_CHILD"),
          ]),
        ],
      ),
      element("DIV", "PRIVATE_NONE", { style: { display: "none" } }, [
        element("SPAN", "PRIVATE_NONE_CHILD"),
      ]),
    ]),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "DIV", parent: 0, classes: "", text: "visible direct text" },
    {
      tag: "SPAN",
      parent: 1,
      classes: "session-status_0",
      text: "visible descendant",
    },
  ]);
  assert.equal(JSON.stringify(output).includes("PRIVATE"), false);
});

test("retains SVG class attributes when native className is an SVGAnimatedString", async (t) => {
  const svg = {
    ...element("svg", "", { class: "visible-icon" }, [
      element("path", "", { class: "icon-path" }),
    ]),
    className: { baseVal: "visible-icon", animVal: "visible-icon" },
  };
  fixture(t, { tree: element("BODY", "visible page", {}, [svg]) });
  const output = await capture();
  assert.deepEqual(
    output.capture.nodes.map((/** @type {any} */ n) => [n.tag, n.classes]),
    [
      ["BODY", ""],
      ["svg", "visible-icon"],
      ["path", "icon-path"],
    ],
  );
});

test("excludes content-visibility hidden contents even when the wrapper has a box", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "PRIVATE_CONTENT",
        { style: { contentVisibility: "hidden" } },
        [
          element("SPAN", "PRIVATE_CHILD", {
            style: { visibility: "visible" },
          }),
        ],
      ),
      element("SPAN", "visible sibling"),
    ]),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "SPAN", parent: 0, classes: "", text: "visible sibling" },
  ]);
  assert.equal(JSON.stringify(output).includes("PRIVATE"), false);
});

test("retains painted visibility overrides under hidden ancestors without their hidden text or links", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element("SECTION", "visible section", {}, [
        element(
          "A",
          "PRIVATE_WRAPPER_TEXT",
          {
            href: "/app/speaker/session/42?private=hidden-link",
            style: { visibility: "hidden" },
          },
          [
            element("SPAN", "PRIVATE_INHERITED_TEXT", {
              style: { visibility: "hidden" },
            }),
            element("SPAN", "painted child", {
              style: { visibility: "visible" },
            }),
            element(
              "DIV",
              "PRIVATE_NESTED_TEXT",
              { style: { visibility: "hidden" } },
              [
                element("SPAN", "painted grandchild", {
                  style: { visibility: "visible" },
                }),
              ],
            ),
            element(
              "FORM",
              "PRIVATE_FORM",
              { style: { visibility: "hidden" } },
              [
                element("SPAN", "PRIVATE_FORM_CHILD", {
                  style: { visibility: "visible" },
                }),
              ],
            ),
          ],
        ),
      ]),
    ]),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "SECTION", parent: 0, classes: "", text: "visible section" },
    { tag: "SPAN", parent: 1, classes: "", text: "painted child" },
    { tag: "SPAN", parent: 1, classes: "", text: "painted grandchild" },
  ]);
  assert.equal(JSON.stringify(output).includes("PRIVATE"), false);
  assert.equal(JSON.stringify(output).includes("hidden-link"), false);
});

test("retains an empty structural BODY for multiple painted children of a hidden body", async (t) => {
  fixture(t, {
    tree: element(
      "BODY",
      "PRIVATE_BODY_TEXT",
      { class: "PRIVATE_BODY_CLASS", style: { visibility: "hidden" } },
      [
        element("SPAN", "first painted child", {
          style: { visibility: "visible" },
        }),
        element("SPAN", "PRIVATE_INHERITED_TEXT", {
          style: { visibility: "hidden" },
        }),
        element("SPAN", "second painted child", {
          style: { visibility: "visible" },
        }),
      ],
    ),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "SPAN", parent: 0, classes: "", text: "first painted child" },
    { tag: "SPAN", parent: 0, classes: "", text: "second painted child" },
  ]);
  assert.equal(JSON.stringify(output).includes("PRIVATE"), false);
});

for (const kind of ["empty", "hidden", "private-form"]) {
  test(`holds a hidden BODY with only ${kind} contents`, async (t) => {
    const children =
      kind === "empty"
        ? []
        : kind === "hidden"
          ? [
              element("SPAN", "PRIVATE_HIDDEN", {
                style: { visibility: "hidden" },
              }),
            ]
          : [
              element("FORM", "PRIVATE_FORM", {}, [
                element("INPUT", "PRIVATE_VALUE"),
              ]),
            ];
    fixture(t, {
      tree: element(
        "BODY",
        "PRIVATE_BODY_TEXT",
        { style: { visibility: "hidden" } },
        children,
      ),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

for (const kind of ["empty", "excluded", "nested", "empty-box"]) {
  test(`holds structural-only ${kind} descendants under a hidden BODY`, async (t) => {
    const children =
      kind === "empty"
        ? []
        : kind === "excluded"
          ? [
              element("FORM", "PRIVATE_FORM", {}, [
                element("SPAN", "PRIVATE_CHILD"),
              ]),
            ]
          : kind === "nested"
            ? [
                element("DIV", "", {
                  rendered: false,
                  style: { display: "contents" },
                }),
              ]
            : [element("SPAN")];
    fixture(t, {
      tree: element(
        "BODY",
        "PRIVATE_BODY",
        { style: { visibility: "hidden" } },
        [
          element(
            "DIV",
            "",
            {
              rendered: false,
              style: { display: "contents", visibility: "visible" },
            },
            children,
          ),
        ],
      ),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

test("a hidden BODY can retain direct visible text in a boxless descendant", async (t) => {
  fixture(t, {
    tree: element("BODY", "PRIVATE_BODY", { style: { visibility: "hidden" } }, [
      element("DIV", "painted boxless text", {
        rendered: false,
        style: { display: "contents", visibility: "visible" },
      }),
    ]),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "DIV", parent: 0, classes: "", text: "painted boxless text" },
  ]);
});

test("holds auto-skipped contents before exporting wrapper text or descendants", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "PRIVATE_AUTO_TEXT",
        { style: { contentVisibility: "auto" } },
        [element("SPAN", "PRIVATE_AUTO_CHILD", { autoSkippedAncestor: true })],
      ),
    ]),
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
});

test("captures unskipped auto contents using an existing descendant through a boxless wrapper", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "visible auto text",
        { style: { contentVisibility: "auto" } },
        [
          element(
            "DIV",
            "visible boxless text",
            { rendered: false, style: { display: "contents" } },
            [element("SPAN", "painted descendant")],
          ),
        ],
      ),
    ]),
  });
  const output = await capture();
  assert.deepEqual(
    output.capture.nodes.map((/** @type {any} */ n) => [n.text, n.parent]),
    [
      ["", null],
      ["visible auto text", 0],
      ["visible boxless text", 1],
      ["painted descendant", 2],
    ],
  );
});

test("unskipped auto witness preserves a painted visibility override", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "PRIVATE_HIDDEN_AUTO_TEXT",
        { style: { contentVisibility: "auto", visibility: "hidden" } },
        [
          element("SPAN", "painted override", {
            style: { visibility: "visible" },
          }),
        ],
      ),
    ]),
  });
  const output = await capture();
  assert.deepEqual(output.capture.nodes, [
    { tag: "BODY", parent: null, classes: "", text: "" },
    { tag: "SPAN", parent: 0, classes: "", text: "painted override" },
  ]);
});

for (const missing of ["method", "option", "descendant"]) {
  test(`holds uncertain auto visibility without ${missing} proof`, async (t) => {
    const child = element("SPAN", "PRIVATE_UNCERTAIN_CHILD");
    if (missing === "method") Reflect.deleteProperty(child, "checkVisibility");
    if (missing === "option") child.checkVisibility = () => true;
    fixture(t, {
      tree: element("BODY", "", {}, [
        element(
          "DIV",
          "PRIVATE_UNCERTAIN_TEXT",
          { style: { contentVisibility: "auto" } },
          missing === "descendant" ? [] : [child],
        ),
      ]),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

test("does not use excluded form contents as an auto-visibility witness", async (t) => {
  const form = element("FORM", "PRIVATE_FORM", {}, [
    element("INPUT", "PRIVATE_VALUE"),
  ]);
  form.checkVisibility = () => assert.fail("private form is not a witness");
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "PRIVATE_UNCERTAIN_TEXT",
        { style: { contentVisibility: "auto" } },
        [form],
      ),
    ]),
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
});

test("bounds the existing-element witness search before reading auto contents", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element(
        "DIV",
        "PRIVATE_CAPACITY_TEXT",
        { style: { contentVisibility: "auto" } },
        [
          ...Array.from({ length: 12_001 }, () =>
            element("FORM", "PRIVATE_FORM"),
          ),
          element("SPAN", "late painted witness"),
        ],
      ),
    ]),
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
});

for (const style of [
  { color: "transparent" },
  { color: "rgba(0, 0, 0, 0)" },
  { fontSize: "0px" },
]) {
  test(`omits unpainted own text with ${JSON.stringify(style)} while preserving a child override`, async (t) => {
    fixture(t, {
      tree: element("BODY", "", {}, [
        element("DIV", "PRIVATE_GLYPHS", { style }, [
          element("SPAN", "painted child"),
        ]),
      ]),
    });
    const output = await capture();
    assert.deepEqual(
      output.capture.nodes.map((/** @type {any} */ n) => n.text),
      ["", "", "painted child"],
    );
    assert.equal(JSON.stringify(output).includes("PRIVATE_GLYPHS"), false);
  });

  test(`unpainted ${JSON.stringify(style)} text cannot retain a hidden BODY`, async (t) => {
    fixture(t, {
      tree: element(
        "BODY",
        "PRIVATE_BODY",
        { style: { visibility: "hidden" } },
        [
          element("SPAN", "PRIVATE_GLYPHS", {
            style: { visibility: "visible", ...style },
          }),
        ],
      ),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

for (const style of [
  { color: "color(display-p3 1 0 0)" },
  { fontSize: "unknown" },
  { color: "transparent", textShadow: "1px 1px black" },
]) {
  test(`holds uncertain text paint with ${JSON.stringify(style)}`, async (t) => {
    fixture(t, {
      tree: element("BODY", "", {}, [
        element("SPAN", "PRIVATE_UNCERTAIN", { style }),
      ]),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

test("uses the actual native text fill override and SVG fill instead of assuming color paints glyphs", async (t) => {
  fixture(t, {
    tree: element("BODY", "", {}, [
      element("SPAN", "PRIVATE_FILL", {
        style: { webkitTextFillColor: "transparent" },
      }),
      element("tspan", "PRIVATE_SVG_FILL", { style: { fill: "none" } }),
      element("SPAN", "painted override", {
        style: { color: "transparent", webkitTextFillColor: "rgb(0, 0, 0)" },
      }),
    ]),
  });
  const output = await capture();
  assert.deepEqual(
    output.capture.nodes.map((/** @type {any} */ n) => n.text),
    ["", "", "", "painted override"],
  );
});

test("omits SVG text with zero fill opacity without discarding visible page text", async (t) => {
  fixture(t, {
    tree: element("BODY", "visible page", {}, [
      element("text", "PRIVATE_ZERO_FILL", { style: { fillOpacity: "0" } }),
    ]),
  });
  const output = await capture();
  assert.deepEqual(
    output.capture.nodes.map((/** @type {any} */ n) => n.text),
    ["visible page", ""],
  );
  assert.equal(JSON.stringify(output).includes("PRIVATE_ZERO_FILL"), false);
});

for (const style of [
  { fillOpacity: "unknown" },
  { fillOpacity: "0", stroke: "rgb(0, 0, 0)" },
]) {
  test(`holds uncertain SVG fill or alternate stroke ${JSON.stringify(style)}`, async (t) => {
    fixture(t, {
      tree: element("BODY", "visible page", {}, [
        element("text", "PRIVATE_SVG", { style }),
      ]),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

for (const kind of ["empty", "image-only", "whitespace"]) {
  test(`holds a visible ${kind} tree without eligible text`, async (t) => {
    fixture(t, {
      tree: element(
        "BODY",
        kind === "whitespace" ? "   " : "",
        {},
        kind === "image-only" ? [element("IMG")] : [],
      ),
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

test("validates the serialized tree's nonempty text witness", async (t) => {
  fixture(t, {
    resultOverride: {
      schema_version: 1,
      origin: "https://sessionize.com",
      path: "/app/speaker/events",
      title: "My events",
      nodes: [{ tag: "BODY", parent: null, classes: "", text: "" }],
    },
  });
  await assert.rejects(capture(), /Sessionize capture unavailable/);
});

for (const text of [
  "\u200b",
  "visible\u200btext",
  "\ufe0f",
  "visible\u0000text",
]) {
  test(`holds unsupported no-ink or control content ${JSON.stringify(text)} before exporting it`, async (t) => {
    fixture(t, { tree: element("BODY", text) });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
  test(`holds serialized unsupported content ${JSON.stringify(text)}`, async (t) => {
    fixture(t, {
      resultOverride: {
        schema_version: 1,
        origin: "https://sessionize.com",
        path: "/app/speaker/events",
        title: "My events",
        nodes: [{ tag: "BODY", parent: null, classes: "", text }],
      },
    });
    await assert.rejects(capture(), /Sessionize capture unavailable/);
  });
}

test("retains ordinary text with normalized visible word spacing", async (t) => {
  fixture(t, { tree: element("BODY", "  visible\u00a0\ttext\n") });
  const output = await capture();
  assert.equal(output.capture.nodes[0].text, "visible text");
});
