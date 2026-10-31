import childProcess from "node:child_process";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Fixed private-browser protocol; no caller endpoint, role or path selectors.
const ENDPOINT = "http://visible-browser:9222";
// The fixed native relay projects ordinary Page/Target document URLs to origins.
// Exact route identity is read separately inside the isolated Runtime context.
const ORIGIN = "https://sessionize.com";
const DEADLINE = 10_000;
const MAX_CAPTURE_BYTES = 1_500_000;
const SCOPE =
  "Complete rendered node tree of the observed My Events view; forms, hidden content, credential/storage values and unsafe links excluded. Account/filter/history completeness remains unknown until consumer validation.";
class CaptureHold extends Error {
  constructor() {
    super(
      "Sessionize capture unavailable: preserve the page; verify the existing signed-in My Events view and private browser service before a new explicit read. No source completeness established.",
    );
  }
}

/** @param {string} text */
function eligibleTextContent(text) {
  return (
    text.trim().length > 0 &&
    !/[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]/u.test(text)
  );
}

/** This function and its fixed content predicate are serialized into a fresh
 * isolated world. No website JS or form-value, storage, profile, network or
 * editing API is invoked.
 * @param {(text:string)=>boolean} eligibleContent */
function readRenderedTree(eligibleContent) {
  if (
    location.href !== "https://sessionize.com/app/speaker/events" ||
    document.readyState !== "complete" ||
    !document.body ||
    !document.title ||
    document.title.length > 300
  )
    throw new Error("capture_hold");
  /** @type {{tag:string,parent:number|null,classes:string,text:string,href?:string,link_omitted?:true}[]} */
  const nodes = [];
  const MAX_NODES = 12_000;
  let autoWitnessVisits = 0;
  let visibleTextNodes = 0;
  const forbidden = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "FORM",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "IFRAME",
    "OBJECT",
    "EMBED",
  ]);
  /** @param {string} value */
  function alpha(value) {
    if (value === "transparent" || value === "none") return 0;
    const match =
      /^rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\)$/.exec(
        value,
      );
    if (!match || match.slice(1, 4).some((v) => Number(v) > 255))
      throw new Error("capture_hold");
    const opacity = match[4] === undefined ? 1 : Number(match[4]);
    if (!Number.isFinite(opacity) || opacity > 1)
      throw new Error("capture_hold");
    return opacity;
  }
  /** @param {Element} element @param {CSSStyleDeclaration} style */
  function eligibleText(element, style) {
    if (!/^\d+(?:\.\d+)?px$/.test(style.fontSize))
      throw new Error("capture_hold");
    const size = Number(style.fontSize.slice(0, -2));
    if (!Number.isFinite(size)) throw new Error("capture_hold");
    if (size === 0) return false;
    const svg = element.namespaceURI === "http://www.w3.org/2000/svg";
    const fillOpacity = svg ? style.fillOpacity : "1";
    if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(fillOpacity))
      throw new Error("capture_hold");
    const ink =
      alpha(svg ? style.fill : style.webkitTextFillColor) * Number(fillOpacity);
    if (ink > 0) return true;
    // Transparent fill can still paint through a shadow or stroke. An uncertain
    // alternate paint source holds rather than exporting or assuming emptiness.
    if (
      style.textShadow !== "none" ||
      (svg ? style.stroke !== "none" : style.webkitTextStrokeWidth !== "0px")
    )
      throw new Error("capture_hold");
    return false;
  }
  /** @param {Element} element @returns {boolean} */
  function hasUnskippedDescendant(element) {
    for (const child of element.children) {
      if (++autoWitnessVisits > MAX_NODES) throw new Error("capture_hold");
      if (
        forbidden.has(child.tagName.toUpperCase()) ||
        child.hasAttribute("hidden")
      )
        continue;
      if (typeof child.checkVisibility !== "function")
        throw new Error("capture_hold");
      let requested = false;
      const visible = child.checkVisibility({
        get contentVisibilityAuto() {
          requested = true;
          return true;
        },
      });
      if (!requested) throw new Error("capture_hold");
      if (visible === true || hasUnskippedDescendant(child)) return true;
    }
    return false;
  }
  /** @param {Element} element @param {number|null} parent */
  function visit(element, parent) {
    const style = getComputedStyle(element);
    const kind = element.tagName.toUpperCase();
    if (
      forbidden.has(kind) ||
      element.hasAttribute("hidden") ||
      style.display === "none" ||
      style.contentVisibility === "hidden" ||
      style.opacity === "0"
    )
      return;
    if (style.contentVisibility === "auto" && !hasUnskippedDescendant(element))
      throw new Error("capture_hold");
    if (["hidden", "collapse"].includes(style.visibility)) {
      const projectedParent =
        element === document.body
          ? nodes.push({
              tag: element.tagName,
              parent: null,
              classes: "",
              text: "",
            }) - 1
          : parent;
      const beforeText = visibleTextNodes;
      for (const child of element.children) visit(child, projectedParent);
      if (element === document.body && visibleTextNodes === beforeText)
        throw new Error("capture_hold");
      return;
    }
    if (!element.getClientRects().length && style.display !== "contents")
      return;
    if (nodes.length >= MAX_NODES) throw new Error("capture_hold");
    const directText = Array.from(element.childNodes).filter(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    let text = directText
      .map((n) => n.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !eligibleText(element, style)) text = "";
    if (text && !eligibleContent(text)) throw new Error("capture_hold");
    const classes = element.getAttribute("class") ?? "";
    if (text.length > 16_000 || classes.length > 1_000)
      throw new Error("capture_hold");
    if (text) visibleTextNodes++;
    /** @type {{tag:string,parent:number|null,classes:string,text:string,href?:string,link_omitted?:true}} */
    const node = { tag: element.tagName, parent, classes, text };
    if (kind === "A") {
      const raw = element.getAttribute("href");
      let url;
      if (raw !== null) {
        try {
          url = new URL(raw, location.href);
        } catch (error) {
          if (!(error instanceof TypeError)) throw error;
        }
      }
      if (
        url &&
        url.origin === "https://sessionize.com" &&
        !url.search &&
        !url.hash &&
        !url.username &&
        !url.password &&
        (/^\/app\/speaker\/event\/details\/\d+$/.test(url.pathname) ||
          /^\/app\/speaker\/session\/[A-Za-z0-9_-]{1,100}$/.test(url.pathname))
      )
        node.href = url.href;
      else node.link_omitted = true;
    }
    const index = nodes.push(node) - 1;
    for (const child of element.children) visit(child, index);
  }
  visit(document.body, null);
  if (!nodes.length || !visibleTextNodes) throw new Error("capture_hold");
  if (!Number.isFinite(performance.timeOrigin) || performance.timeOrigin <= 0)
    throw new Error("capture_hold");
  return {
    capture: {
      schema_version: 1,
      origin: location.origin,
      path: location.pathname,
      title: document.title,
      nodes,
    },
    timeOrigin: performance.timeOrigin,
  };
}

/** Same isolated execution context; no content or private URL is returned. */
function readDocumentIdentity() {
  return {
    exactPage: location.href === "https://sessionize.com/app/speaker/events",
    ready: document.readyState === "complete",
    timeOrigin: performance.timeOrigin,
  };
}

/** @param {unknown} value @returns {Record<string, any>} */
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CaptureHold();
  return value;
}
/** @param {string} text */
function parse(text) {
  try {
    return record(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) throw new CaptureHold();
    throw error;
  }
}

async function discovery() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE);
  try {
    const response = await fetch(`${ENDPOINT}/json/version`, {
      method: "GET",
      redirect: "error",
      credentials: "omit",
      signal: controller.signal,
    });
    if (response.status !== 200 || !response.body) throw new CaptureHold();
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > 65_536) throw new CaptureHold();
        chunks.push(next.value);
      }
    } finally {
      reader.releaseLock();
    }
    const value = parse(Buffer.concat(chunks).toString("utf8"));
    if (
      typeof value.webSocketDebuggerUrl !== "string" ||
      !/^ws:\/\/visible-browser:9222\/devtools\/browser\/[A-Za-z0-9-]+$/.test(
        value.webSocketDebuggerUrl,
      )
    )
      throw new CaptureHold();
    return value.webSocketDebuggerUrl;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

/** @param {string} endpoint */
async function connect(endpoint) {
  const socket = new WebSocket(endpoint);
  let sequence = 0;
  /** @type {Map<number,{resolve:(v:Record<string,any>)=>void,reject:(e:Error)=>void,timer:ReturnType<typeof setTimeout>,sessionId?:string}>} */
  const pending = new Map();
  /** @param {Error} error */
  function fail(error) {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    pending.clear();
  }
  socket.addEventListener("message", (event) => {
    if (
      typeof event.data !== "string" ||
      Buffer.byteLength(event.data) > MAX_CAPTURE_BYTES
    ) {
      fail(new CaptureHold());
      return;
    }
    let reply;
    try {
      reply = parse(event.data);
    } catch (error) {
      if (!(error instanceof CaptureHold)) throw error;
      fail(error);
      return;
    }
    const entry = pending.get(reply.id);
    if (!entry) return;
    pending.delete(reply.id);
    clearTimeout(entry.timer);
    if (
      reply.sessionId !== entry.sessionId ||
      reply.error ||
      !reply.result ||
      typeof reply.result !== "object" ||
      Array.isArray(reply.result)
    )
      entry.reject(new CaptureHold());
    else entry.resolve(reply.result);
  });
  socket.addEventListener("close", () => fail(new CaptureHold()));
  socket.addEventListener("error", () => fail(new CaptureHold()));
  let connected = false;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new CaptureHold()), DEADLINE);
      socket.addEventListener(
        "open",
        () => {
          clearTimeout(timer);
          resolve(undefined);
        },
        { once: true },
      );
      socket.addEventListener(
        "error",
        () => {
          clearTimeout(timer);
          reject(new CaptureHold());
        },
        { once: true },
      );
      socket.addEventListener(
        "close",
        () => {
          clearTimeout(timer);
          reject(new CaptureHold());
        },
        { once: true },
      );
    });
    connected = true;
  } finally {
    if (!connected) socket.close();
  }
  return {
    /** @param {string} method @param {Record<string,unknown>} [params] @param {string} [sessionId] */
    call(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        if (socket.readyState !== WebSocket.OPEN) {
          reject(new CaptureHold());
          return;
        }
        const id = ++sequence;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new CaptureHold());
        }, DEADLINE);
        pending.set(id, { resolve, reject, timer, sessionId });
        socket.send(
          JSON.stringify({
            id,
            method,
            params,
            ...(sessionId ? { sessionId } : {}),
          }),
        );
      });
    },
    async close() {
      if (socket.readyState === WebSocket.CLOSED) return;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new CaptureHold()), DEADLINE);
        socket.addEventListener(
          "close",
          () => {
            clearTimeout(timer);
            resolve(undefined);
          },
          { once: true },
        );
        socket.close();
      });
    },
  };
}

/** @returns {Promise<{schema_version:number,source:string,observed_at:string,capture:Record<string,any>}>}
 * No inputs. Uses only the installed native validator and its fixed private
 * browser. A successful return is observation, not account/history authority. */
export async function capture() {
  if (arguments.length) throw new CaptureHold();
  let validation;
  try {
    validation = childProcess.execFileSync(
      "node",
      ["/usr/local/lib/nanoclaw/validate-visible-browser.mts"],
      {
        encoding: "utf8",
        timeout: 20_000,
        maxBuffer: 4096,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      ("status" in error || "code" in error || "signal" in error)
    )
      throw new CaptureHold();
    throw error;
  }
  if (validation !== '{"available":true}\n') throw new CaptureHold();
  const client = await connect(await discovery());
  let session;
  try {
    const inventory = await client.call("Target.getTargets");
    if (!Array.isArray(inventory.targetInfos)) throw new CaptureHold();
    const matches = inventory.targetInfos.filter(
      /** @param {Record<string, any>} t */ (t) =>
        t?.type === "page" && t.url === `${ORIGIN}/`,
    );
    if (
      matches.length !== 1 ||
      typeof matches[0].targetId !== "string" ||
      !matches[0].targetId
    )
      throw new CaptureHold();
    const before = record(
      (
        await client.call("Target.getTargetInfo", {
          targetId: matches[0].targetId,
        })
      ).targetInfo,
    );
    if (
      before.type !== "page" ||
      before.url !== `${ORIGIN}/` ||
      before.targetId !== matches[0].targetId ||
      typeof before.browserContextId !== "string" ||
      !before.browserContextId
    )
      throw new CaptureHold();
    const attached = await client.call("Target.attachToTarget", {
      targetId: before.targetId,
      flatten: true,
    });
    if (typeof attached.sessionId !== "string" || !attached.sessionId)
      throw new CaptureHold();
    session = attached.sessionId;
    const frame = record(
      record((await client.call("Page.getFrameTree", {}, session)).frameTree)
        .frame,
    );
    if (
      typeof frame.id !== "string" ||
      !frame.id ||
      frame.parentId ||
      frame.url !== `${ORIGIN}/` ||
      typeof frame.loaderId !== "string" ||
      !frame.loaderId ||
      frame.securityOrigin !== ORIGIN ||
      frame.unreachableUrl
    )
      throw new CaptureHold();
    const world = await client.call(
      "Page.createIsolatedWorld",
      {
        frameId: frame.id,
        worldName: "nanoclaw-sessionize-read",
        grantUniveralAccess: false,
      },
      session,
    );
    if (
      !Number.isSafeInteger(world.executionContextId) ||
      world.executionContextId <= 0
    )
      throw new CaptureHold();
    const result = await client.call(
      "Runtime.evaluate",
      {
        expression: `(${readRenderedTree.toString()})(${eligibleTextContent.toString()})`,
        contextId: world.executionContextId,
        returnByValue: true,
        awaitPromise: false,
        throwOnSideEffect: true,
        timeout: DEADLINE,
      },
      session,
    );
    if (result.exceptionDetails) throw new CaptureHold();
    const observed = record(record(result.result).value);
    const dom = record(observed.capture);
    if (!Number.isFinite(observed.timeOrigin) || observed.timeOrigin <= 0)
      throw new CaptureHold();
    if (
      Buffer.byteLength(JSON.stringify(dom)) > MAX_CAPTURE_BYTES ||
      dom.schema_version !== 1 ||
      dom.origin !== ORIGIN ||
      dom.path !== "/app/speaker/events" ||
      typeof dom.title !== "string" ||
      !dom.title ||
      dom.title.length > 300 ||
      !Array.isArray(dom.nodes) ||
      !dom.nodes.length
    )
      throw new CaptureHold();
    if (
      Object.keys(dom).sort().join(",") !==
        "nodes,origin,path,schema_version,title" ||
      dom.nodes.length > 12_000
    )
      throw new CaptureHold();
    for (const [index, node] of dom.nodes.entries()) {
      const item = record(node);
      if (
        !Object.keys(item).every((key) =>
          ["tag", "parent", "classes", "text", "href", "link_omitted"].includes(
            key,
          ),
        ) ||
        typeof item.tag !== "string" ||
        !/^[A-Za-z][A-Za-z0-9-]{0,19}$/.test(item.tag) ||
        typeof item.text !== "string" ||
        item.text.length > 16_000 ||
        (item.text !== "" && !eligibleTextContent(item.text)) ||
        typeof item.classes !== "string" ||
        item.classes.length > 1_000 ||
        (index === 0
          ? item.parent !== null
          : !Number.isInteger(item.parent) ||
            item.parent < 0 ||
            item.parent >= index) ||
        (item.link_omitted !== undefined && item.link_omitted !== true) ||
        (item.href !== undefined &&
          (typeof item.href !== "string" ||
            !/^https:\/\/sessionize\.com\/app\/speaker\/(?:event\/details\/\d+|session\/[A-Za-z0-9_-]{1,100})$/.test(
              item.href,
            ))) ||
        (item.href !== undefined && item.link_omitted !== undefined)
      )
        throw new CaptureHold();
    }
    if (!dom.nodes.some((node) => eligibleTextContent(node.text)))
      throw new CaptureHold();
    const identityResult = await client.call(
      "Runtime.evaluate",
      {
        expression: `(${readDocumentIdentity.toString()})()`,
        contextId: world.executionContextId,
        returnByValue: true,
        awaitPromise: false,
        throwOnSideEffect: true,
        timeout: DEADLINE,
      },
      session,
    );
    if (identityResult.exceptionDetails) throw new CaptureHold();
    const identity = record(record(identityResult.result).value);
    if (
      identity.exactPage !== true ||
      identity.ready !== true ||
      identity.timeOrigin !== observed.timeOrigin
    )
      throw new CaptureHold();
    const afterFrame = record(
      record((await client.call("Page.getFrameTree", {}, session)).frameTree)
        .frame,
    );
    const after = record(
      (await client.call("Target.getTargetInfo", { targetId: before.targetId }))
        .targetInfo,
    );
    if (
      after.targetId !== before.targetId ||
      after.type !== before.type ||
      after.url !== before.url ||
      after.browserContextId !== before.browserContextId ||
      afterFrame.id !== frame.id ||
      afterFrame.loaderId !== frame.loaderId ||
      afterFrame.url !== frame.url ||
      afterFrame.securityOrigin !== ORIGIN ||
      afterFrame.parentId ||
      afterFrame.unreachableUrl
    )
      throw new CaptureHold();
    return {
      schema_version: 1,
      source: "sessionize",
      observed_at: new Date().toISOString(),
      capture: { ...dom, scope: SCOPE },
    };
  } finally {
    try {
      if (session)
        await client.call("Target.detachFromTarget", { sessionId: session });
    } finally {
      await client.close();
    }
  }
}

if (
  import.meta.url.startsWith("file:") &&
  process.argv[1] &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
) {
  try {
    if (process.argv.length !== 2) throw new CaptureHold();
    console.log(JSON.stringify(await capture()));
    // outer-boundary-process-contract: CLI callers require empty stdout/nonzero with fixed recovery stderr; emit that diagnostic here; propagation could expose native/page payloads and violate this failure contract.
  } catch {
    console.error(new CaptureHold().message);
    process.exitCode = 1;
  }
}
