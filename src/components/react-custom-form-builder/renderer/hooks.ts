import type { FieldSchema, FormSchema } from "../types";
import { safeExecuteHook as workerExecute } from "./hook-sandbox";

/**
 * Execute a field hook function. The function body is stored as a string
 * containing a named function declaration. We extract and call it with
 * (value, fieldName, allValues). If it throws, return the original value.
 */
function executeHook(
  code: string,
  fnName: string,
  value: unknown,
  fieldName: string,
  allValues: Record<string, unknown>,
  widgetData?: Record<string, unknown>,
): unknown {
  try {
    const fn = new Function(
      `${code}\nreturn ${fnName}(arguments[0], arguments[1], arguments[2], arguments[3]);`,
    );
    return fn(value, fieldName, allValues, widgetData ?? {});
  } catch {
    return value;
  }
}

/**
 * Run beforePreload hooks on initial values before they're loaded into form state.
 * Each field's hook transforms only its own value.
 */
export function runPreloadHooks(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...values };
  const allFields = collectAllFields(fields);
  for (const field of allFields) {
    const code = field.hooks?.beforePreload;
    if (!code) continue;
    const key = field.name;
    if (key in result) {
      result[key] = executeHook(code, "beforePreload", result[key], key, result);
    }
  }
  return result;
}

/**
 * Run beforeSubmit hooks on form values before submission.
 * Each field's hook transforms only its own value — key stays the same.
 */
export function runSubmitHooks(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...values };
  const allFields = collectAllFields(fields);
  for (const field of allFields) {
    const code = field.hooks?.beforeSubmit;
    if (!code) continue;
    const key = field.name;
    if (key in result) {
      result[key] = executeHook(code, "beforeSubmit", result[key], key, result);
    }
  }
  return result;
}

/**
 * Run custom validate hooks.
 * Returns a map of fieldName → error message for fields that fail.
 *
 *   return true    → pass
 *   return false   → "Invalid value"
 *   return "msg"   → custom error
 *   throws         → pass (fail-open)
 */
export function runValidateHooks(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const code = field.hooks?.validate;
    if (!code) continue;
    try {
      const result = executeHook(code, "validate", values[field.name], field.name, values);
      if (result === true) continue;
      if (result === false) {
        errors[field.name] = "Invalid value";
      } else if (typeof result === "string" && result.length > 0) {
        errors[field.name] = result;
      }
    } catch {
      // fail-open: if hook throws, validation passes
    }
  }
  return errors;
}

// ── Side effects ──────────────────────────────────────────────

export interface SideEffectResult {
  hidden: Set<string>;
  disabled: Set<string>;
  required: Set<string>;
  overrides: Record<string, unknown>;
}

/**
 * Run sideEffect hooks for all fields.
 * Each hook returns { hide: string[], disable: string[], override: { key: value } }.
 * - hide/disable: the field's own key is stripped (can't hide/disable itself)
 * - override: set another field's value (own key stripped too)
 * Runs after beforePreload hooks, re-runs on every value change.
 */
/** Recursively collect all fields including inside sections and tabs */
function collectAllFields(fields: FieldSchema[]): FieldSchema[] {
  const result: FieldSchema[] = [];
  for (const f of fields) {
    result.push(f);
    if (f.children) result.push(...collectAllFields(f.children));
    if (f.tabs) for (const tab of f.tabs) result.push(...collectAllFields(tab.fields));
  }
  return result;
}

/** Resolve a field's value by walking into container state */
function resolveValue(
  fieldName: string,
  topValues: Record<string, unknown>,
  fields: FieldSchema[],
): unknown {
  if (fieldName in topValues) return topValues[fieldName];
  for (const f of fields) {
    if (f.children && f.type !== "array") {
      const data = (topValues[f.name] as Record<string, unknown>) ?? {};
      if (fieldName in data) return data[fieldName];
      const deeper = resolveValue(fieldName, data, f.children);
      if (deeper !== undefined) return deeper;
    }
    if (f.tabs) {
      const tabState = topValues[f.name] as { data?: Record<string, unknown> } | undefined;
      const tabData = tabState?.data ?? {};
      if (fieldName in tabData) return tabData[fieldName];
      for (const tab of f.tabs) {
        const deeper = resolveValue(fieldName, tabData, tab.fields);
        if (deeper !== undefined) return deeper;
      }
    }
  }
  return undefined;
}

export function runSideEffectHooks(
  fields: FieldSchema[],
  values: Record<string, unknown>,
  widgetData?: Record<string, unknown>,
): SideEffectResult {
  const hidden = new Set<string>();
  const disabled = new Set<string>();
  const required = new Set<string>();
  const overrides: Record<string, unknown> = {};

  const allFields = collectAllFields(fields);

  // Build flat values so hooks can reference any field
  const flatValues: Record<string, unknown> = {};
  for (const f of allFields) {
    flatValues[f.name] = resolveValue(f.name, values, fields);
  }

  for (const field of allFields) {
    const code = field.hooks?.sideEffect;
    if (!code) continue;
    try {
      const fieldValue = flatValues[field.name];
      const result = executeHook(code, "sideEffect", fieldValue, field.name, flatValues, widgetData);
      if (result && typeof result === "object") {
        const r = result as { hide?: string[]; disable?: string[]; required?: string[]; override?: Record<string, unknown> };
        if (Array.isArray(r.hide)) {
          for (const k of r.hide) {
            if (k !== field.name) hidden.add(k);
          }
        }
        if (Array.isArray(r.disable)) {
          for (const k of r.disable) {
            if (k !== field.name) disabled.add(k);
          }
        }
        if (Array.isArray(r.required)) {
          for (const k of r.required) {
            if (k !== field.name) required.add(k);
          }
        }
        if (r.override && typeof r.override === "object" && !Array.isArray(r.override)) {
          for (const [k, v] of Object.entries(r.override)) {
            if (k !== field.name) overrides[k] = v;
          }
        }
      }
    } catch {
      // fail-open
    }
  }

  return { hidden, disabled, required, overrides };
}

// ── Global hooks ──────────────────────────────────────────────

/**
 * Run global beforePreload hook.
 * Receives ALL values, returns transformed values object.
 */
export function runGlobalPreloadHook(
  code: string | undefined,
  values: Record<string, unknown>,
): Record<string, unknown> {
  if (!code) return values;
  try {
    const fn = new Function(
      `${code}\nreturn beforePreload(arguments[0]);`,
    );
    const result = fn(values);
    return (result && typeof result === "object" && !Array.isArray(result)) ? result as Record<string, unknown> : values;
  } catch {
    return values;
  }
}

/**
 * Run global beforeSubmit hook.
 * Receives ALL values (already flattened), returns transformed values object.
 */
export function runGlobalSubmitHook(
  code: string | undefined,
  values: Record<string, unknown>,
): Record<string, unknown> {
  if (!code) return values;
  try {
    const fn = new Function(
      `${code}\nreturn beforeSubmit(arguments[0]);`,
    );
    const result = fn(values);
    return (result && typeof result === "object" && !Array.isArray(result)) ? result as Record<string, unknown> : values;
  } catch {
    return values;
  }
}

/**
 * Run global validate hook.
 * Receives ALL values. Returns:
 *   true   → pass
 *   false  → "Form validation failed"
 *   string → custom error message
 */
export function runGlobalValidateHook(
  code: string | undefined,
  values: Record<string, unknown>,
): string | null {
  if (!code) return null;
  try {
    const fn = new Function(
      `${code}\nreturn validate(arguments[0]);`,
    );
    const result = fn(values);
    if (result === true) return null;
    if (result === false) return "Form validation failed";
    if (typeof result === "string" && result.length > 0) return result;
    return null;
  } catch {
    return null;
  }
}

// ── Async Worker-sandboxed versions ───────────────────────────
//
// These run all hook code in a Web Worker with no DOM/fetch access.
// Use these when rendering AI-generated schemas or untrusted hook code.
// Each hook has a 3s timeout — if it hangs, the default value is returned.

export async function runPreloadHooksAsync(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = { ...values };
  for (const field of fields) {
    const code = field.hooks?.beforePreload;
    if (!code || !(field.name in result)) continue;
    result[field.name] = await workerExecute(code, "beforePreload", [result[field.name], field.name, values], result[field.name]);
  }
  return result;
}

export async function runSubmitHooksAsync(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = { ...values };
  for (const field of fields) {
    const code = field.hooks?.beforeSubmit;
    if (!code || !(field.name in result)) continue;
    result[field.name] = await workerExecute(code, "beforeSubmit", [result[field.name], field.name, values], result[field.name]);
  }
  return result;
}

export async function runValidateHooksAsync(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const code = field.hooks?.validate;
    if (!code) continue;
    try {
      const result = await workerExecute(code, "validate", [values[field.name], field.name, values], true);
      if (result === true) continue;
      if (result === false) errors[field.name] = "Invalid value";
      else if (typeof result === "string" && result.length > 0) errors[field.name] = result;
    } catch { /* fail-open */ }
  }
  return errors;
}

export async function runSideEffectHooksAsync(
  fields: FieldSchema[],
  values: Record<string, unknown>,
  widgetData?: Record<string, unknown>,
): Promise<SideEffectResult> {
  const hidden = new Set<string>();
  const disabled = new Set<string>();
  const required = new Set<string>();
  const overrides: Record<string, unknown> = {};
  for (const field of fields) {
    const code = field.hooks?.sideEffect;
    if (!code) continue;
    try {
      const result = await workerExecute(code, "sideEffect", [values[field.name], field.name, values, widgetData ?? {}], { hide: [], disable: [], required: [], override: {} });
      if (result && typeof result === "object") {
        const r = result as { hide?: string[]; disable?: string[]; required?: string[]; override?: Record<string, unknown> };
        if (Array.isArray(r.hide)) for (const k of r.hide) { if (k !== field.name) hidden.add(k); }
        if (Array.isArray(r.disable)) for (const k of r.disable) { if (k !== field.name) disabled.add(k); }
        if (Array.isArray(r.required)) for (const k of r.required) { if (k !== field.name) required.add(k); }
        if (r.override && typeof r.override === "object" && !Array.isArray(r.override)) {
          for (const [k, v] of Object.entries(r.override)) { if (k !== field.name) overrides[k] = v; }
        }
      }
    } catch { /* fail-open */ }
  }
  return { hidden, disabled, required, overrides };
}

export async function runGlobalPreloadHookAsync(
  code: string | undefined,
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!code) return values;
  const result = await workerExecute(code, "beforePreload", [values], values);
  return (result && typeof result === "object" && !Array.isArray(result)) ? result as Record<string, unknown> : values;
}

export async function runGlobalSubmitHookAsync(
  code: string | undefined,
  values: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!code) return values;
  const result = await workerExecute(code, "beforeSubmit", [values], values);
  return (result && typeof result === "object" && !Array.isArray(result)) ? result as Record<string, unknown> : values;
}

export async function runGlobalValidateHookAsync(
  code: string | undefined,
  values: Record<string, unknown>,
): Promise<string | null> {
  if (!code) return null;
  const result = await workerExecute(code, "validate", [values], true);
  if (result === true) return null;
  if (result === false) return "Form validation failed";
  if (typeof result === "string" && result.length > 0) return result;
  return null;
}
