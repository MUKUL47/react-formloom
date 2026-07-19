/**
 * Web Worker for executing form hooks in an isolated sandbox.
 *
 * No DOM, no fetch, no window — pure computation only.
 * Receives: { id, code, fnName, args }
 * Returns:  { id, result } or { id, error }
 *
 * The worker explicitly blocks dangerous globals.
 */
export {}; // Force module scope to avoid TS redeclaration with the sibling copy

// Block access to anything dangerous
const BLOCKED = [
  "document", "window", "self", "globalThis",
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource",
  "importScripts", "navigator", "location", "localStorage", "sessionStorage",
  "indexedDB", "caches", "crypto",
  "postMessage", // shadow the real postMessage inside the eval
];

const BLOCKED_ARGS = BLOCKED.map(() => "undefined").join(",");
const BLOCKED_PARAMS = BLOCKED.join(",");

interface WorkerMessage {
  id: string;
  code: string;
  fnName: string;
  args: unknown[];
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, code, fnName, args } = e.data;
  try {
    // Wrap the user code in a function that shadows dangerous globals
    const wrapper = new Function(
      BLOCKED_PARAMS,
      `${code}\nreturn ${fnName}.apply(null, arguments[${BLOCKED.length}]);`,
    );
    const result = wrapper(...Array(BLOCKED.length).fill(undefined), args);
    (self as any).postMessage({ id, result });
  } catch (err: any) {
    (self as any).postMessage({ id, error: err?.message ?? "Hook execution failed" });
  }
};
