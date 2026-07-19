/**
 * Sandboxed hook executor using a Web Worker.
 *
 * - All user-defined hook code runs in an isolated thread
 * - No DOM, no fetch, no window access
 * - Timeout protection (default 3s)
 * - Falls back to inline execution if Worker unavailable
 *
 * Usage:
 *   const sandbox = createHookSandbox();
 *   const result = await sandbox.execute(code, "beforeSubmit", [value, fieldName, allValues]);
 *   sandbox.terminate(); // cleanup
 */

let workerInstance: Worker | null = null;
let pendingCallbacks = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
let idCounter = 0;

function getWorker(): Worker | null {
  if (workerInstance) return workerInstance;
  try {
    workerInstance = new Worker(
      new URL("./hook-worker.ts", import.meta.url),
      { type: "module" },
    );
    workerInstance.onmessage = (e: MessageEvent<{ id: string; result?: unknown; error?: string }>) => {
      const { id, result, error } = e.data;
      const pending = pendingCallbacks.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingCallbacks.delete(id);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    };
    workerInstance.onerror = () => {
      // Worker crashed — reject all pending and reset
      for (const [, p] of pendingCallbacks) {
        clearTimeout(p.timer);
        p.reject(new Error("Worker crashed"));
      }
      pendingCallbacks.clear();
      workerInstance = null;
    };
    return workerInstance;
  } catch {
    return null;
  }
}

/**
 * Execute a hook function in the worker sandbox.
 *
 * @param code    - The full function declaration as a string
 * @param fnName  - The function name to call (e.g. "beforeSubmit")
 * @param args    - Arguments array to pass to the function
 * @param timeout - Max execution time in ms (default 3000)
 * @returns The function's return value
 * @throws If execution fails or times out
 */
export async function executeInSandbox(
  code: string,
  fnName: string,
  args: unknown[],
  timeout = 3000,
): Promise<unknown> {
  const worker = getWorker();

  if (!worker) {
    // Fallback: inline execution with blocked globals
    return executeInline(code, fnName, args);
  }

  const id = `hook_${++idCounter}_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingCallbacks.delete(id);
      reject(new Error(`Hook "${fnName}" timed out after ${timeout}ms`));
    }, timeout);

    pendingCallbacks.set(id, { resolve, reject, timer });
    worker.postMessage({ id, code, fnName, args });
  });
}

/**
 * Synchronous inline execution with blocked globals.
 * Used as fallback when Worker is unavailable (SSR, tests, etc.)
 */
export function executeInline(
  code: string,
  fnName: string,
  args: unknown[],
): unknown {
  const BLOCKED = [
    "document", "window", "fetch", "XMLHttpRequest",
    "WebSocket", "importScripts", "navigator", "location",
    "localStorage", "sessionStorage",
  ];

  const fn = new Function(
    ...BLOCKED,
    "args",
    `${code}\nreturn ${fnName}.apply(null, args);`,
  );
  return fn(...BLOCKED.map(() => undefined), args);
}

/**
 * Execute a hook safely — returns defaultValue on any error.
 * This is the primary API for the form renderer.
 */
export async function safeExecuteHook(
  code: string,
  fnName: string,
  args: unknown[],
  defaultValue: unknown,
  timeout = 3000,
): Promise<unknown> {
  try {
    return await executeInSandbox(code, fnName, args, timeout);
  } catch {
    return defaultValue;
  }
}

/**
 * Synchronous safe execution — for use in non-async contexts.
 * Uses inline execution with blocked globals (no worker).
 */
export function safeExecuteHookSync(
  code: string,
  fnName: string,
  args: unknown[],
  defaultValue: unknown,
): unknown {
  try {
    return executeInline(code, fnName, args);
  } catch {
    return defaultValue;
  }
}

/** Terminate the worker (call on unmount) */
export function terminateSandbox() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    for (const [, p] of pendingCallbacks) {
      clearTimeout(p.timer);
    }
    pendingCallbacks.clear();
  }
}
