/**
 * formloom/validator — a STANDALONE, raw schema → Zod translator.
 *
 * Ships as its own entry point. Importing it pulls in NO React and NO renderer
 * code — only `zod` (a peer dependency). The same function runs in the browser
 * (validate before submit) and on the server (validate the request), off the
 * one `FormSchema` your builder produced:
 *
 *     client  ─ renderer ─▶ schemaToZod(schema).safeParse(values)
 *                                    │  (identical rules)
 *     server  ─ handler  ─▶ schemaToZod(schema).safeParse(req.body)
 *
 * It is deliberately just a converter: it returns a `z.ZodObject`. What you do
 * with it (`parse`, `safeParse`, cache it, flatten errors) is up to you.
 *
 * VALIDATION ONLY — NO HOOKS.
 * ---------------------------
 * This translator mirrors the renderer's *declarative* validation (the
 * `validation` rules array + `required` + array `minRows`/`maxRows`). It does
 * NOT run per-field or global `validate` HOOKS — those are arbitrary JS you own,
 * so re-run them yourself on the server if you need them. See `PARITY` below.
 *
 * INJECT — add or replace validation, keyed by field `type` OR `meta.widget`.
 * -------------------------------------------------------------------------
 * An injector receives `(field, base)` where `base` is the Zod type the
 * translator computed for that field. Return `base` refined to ADD validation
 * to an EXISTING field, or a brand-new schema to REPLACE it (e.g. for a widget):
 *
 *     schemaToZod(schema, {
 *       inject: {
 *         // tighten a built-in `input` field — augment the base:
 *         email:   (_f, base) => base.endsWith("@acme.com"),
 *         // define a widget from scratch — ignore the base:
 *         rating:  () => z.number().int().min(0).max(5),
 *         country: (f) => f.props?.multiple ? z.array(z.string()) : z.string(),
 *       },
 *     });
 *
 * UNKNOWN FIELDS — widgets / custom types with no `inject` handler.
 * ----------------------------------------------------------------
 * Controlled by `unknownField`:
 *   "passthrough" (default) — keep the value as-is (`z.unknown()`).
 *   "strip"                 — drop the key from the output entirely.
 *   "error"                 — throw `UnknownFieldError` at translation time.
 */
import { z } from "zod";

// ── Minimal schema shape (only what the translator inspects) ─────────────────
export type FieldType =
  | "input" | "textarea" | "number" | "select" | "multiSelect"
  | "checkbox" | "switch" | "datePicker" | "timePicker" | "password"
  | "email" | "phone" | "url" | "radio" | "slider" | "file"
  | "divider" | "heading" | "paragraph" | "hidden" | "dateRange"
  | "section" | "tabs" | "columns" | "array"
  | (string & {}); // widgets / custom types resolve through `inject`

export interface FieldOption { label: string; value: string }

export interface ValidationRule {
  type:
    | "required" | "min" | "max" | "minLength" | "maxLength" | "pattern"
    | "email" | "url" | "numeric" | "alphanumeric"
    | "fileMaxSize" | "fileTypes" | "fileMinCount" | "fileMaxCount";
  value?: unknown;
  message: string;
}

export interface TabDefinition { key: string; label: string; fields: FieldSchema[] }

export interface FieldSchema {
  id: string;
  name: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  props?: Record<string, unknown>;
  tabs?: TabDefinition[];
  children?: FieldSchema[];
  meta?: Record<string, unknown>;
}

export interface FormLoomSchema {
  version: 1;
  fields: FieldSchema[];
}

/**
 * A validator for one field `type` or `meta.widget`.
 * @param field  the field being translated.
 * @param base   the Zod type the translator computed for this field (built-in
 *               rules already applied, or the unknown-field fallback for
 *               widgets). Return `base` refined to ADD validation, or a fresh
 *               schema to REPLACE it.
 */
export type FieldValidator = (field: FieldSchema, base: z.ZodTypeAny) => z.ZodTypeAny;

/** What to do with a widget/custom field that has no `inject` handler. */
export type UnknownFieldPolicy = "passthrough" | "strip" | "error";

export interface SchemaToZodOptions {
  /** Reject empty/missing values for fields marked `required`. Default: false. */
  enforceRequired?: boolean;
  /**
   * Add or replace validation, keyed by field `type` or `meta.widget`. Runs for
   * ANY matching field — built-in OR widget. See `FieldValidator`.
   */
  inject?: Record<string, FieldValidator>;
  /**
   * How to treat a widget / custom-`registerField` type that has no `inject`
   * handler: "passthrough" (default, `z.unknown()`), "strip" (drop the key), or
   * "error" (throw `UnknownFieldError`).
   */
  unknownField?: UnknownFieldPolicy;
}

/** Thrown by `schemaToZod` when `unknownField: "error"` hits an unmapped field. */
export class UnknownFieldError extends Error {
  constructor(public readonly fieldName: string, public readonly key: string) {
    super(
      `formloom/validator: no inject handler for field "${fieldName}" ` +
      `(type/widget "${key}"). Add options.inject[${JSON.stringify(key)}], or ` +
      `set options.unknownField to "passthrough" | "strip".`,
    );
    this.name = "UnknownFieldError";
  }
}

const DISPLAY_TYPES = new Set<string>(["divider", "heading", "paragraph"]);
const FLATTEN_TYPES = new Set<string>(["section", "columns"]); // children promote to top level
// Every leaf type the translator maps natively. Anything else with a
// `meta.widget` or an unrecognised `type` is treated as a widget/custom field.
const BUILTIN_LEAF = new Set<string>([
  "input", "textarea", "number", "select", "multiSelect", "checkbox", "switch",
  "datePicker", "timePicker", "password", "email", "phone", "url", "radio",
  "slider", "file", "hidden", "dateRange", "array",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const ALNUM = /^[a-zA-Z0-9]+$/;
const NUM = /^-?\d+(\.\d+)?$/;

export const MAX_DEPTH = 12;
const MAX_PATTERN_LENGTH = 256;

export class DepthLimitExceededError extends Error {
  constructor(public readonly depth: number) {
    super(`FormLoom schema depth exceeded ${MAX_DEPTH} (got ${depth})`);
    this.name = "DepthLimitExceededError";
  }
}

export function isFormLoomSchema(content: unknown): content is FormLoomSchema {
  if (!content || typeof content !== "object") return false;
  const o = content as Record<string, unknown>;
  return o.version === 1 && Array.isArray(o.fields);
}

/** Translate a FormLoom `FormSchema` into a `z.ZodObject`. */
export function schemaToZod(
  formSchema: unknown,
  options: SchemaToZodOptions = {},
): z.ZodObject<any> {
  if (!isFormLoomSchema(formSchema)) {
    throw new Error("Invalid FormLoom schema: expected { version: 1, fields: [] }");
  }
  // .strip(): unknown/stale keys are dropped, not rejected.
  return z.object(fieldsToShape(formSchema.fields, 0, options)).strip();
}

function fieldsToShape(
  fields: FieldSchema[],
  depth: number,
  options: SchemaToZodOptions,
): Record<string, z.ZodTypeAny> {
  if (depth > MAX_DEPTH) throw new DepthLimitExceededError(depth);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (DISPLAY_TYPES.has(field.type)) continue;

    // section / columns → children flatten to the top level (matches renderer).
    if (FLATTEN_TYPES.has(field.type)) {
      Object.assign(shape, fieldsToShape(field.children ?? [], depth + 1, options));
      continue;
    }
    // tabs → every tab's fields flatten to the top level too.
    if (field.type === "tabs") {
      for (const tab of field.tabs ?? []) {
        Object.assign(shape, fieldsToShape(tab.fields ?? [], depth + 1, options));
      }
      continue;
    }

    const zod = fieldSchemaToZod(field, depth, options);
    if (zod === null) continue; // widget/custom stripped by unknownField policy

    // Arrays carry their own required-ness through `minRows` (matches renderer),
    // so they never take the scalar emptiness refine.
    const isRequired =
      field.type !== "array" &&
      (field.required || (field.validation ?? []).some((r) => r.type === "required"));

    shape[field.name] = finalize(zod, Boolean(options.enforceRequired && isRequired), requiredMessage(field));
  }

  return shape;
}

/**
 * Wrap a field's Zod type with the renderer's empty-value semantics.
 *
 * The renderer treats `undefined | null | ""` as "not provided": it SKIPS every
 * non-required rule for empty values, and fails `required` on them. We reproduce
 * that exactly with a preprocess (empty → undefined) so a non-required field
 * never trips its own `minLength`/format rules on an empty value, and a required
 * field fails on empty (including `[]`) with the required message.
 */
function finalize(zod: z.ZodTypeAny, required: boolean, message: string): z.ZodTypeAny {
  const emptyToUndef = (v: unknown) => (v === "" || v === null ? undefined : v);
  if (!required) {
    return z.preprocess(emptyToUndef, zod.optional());
  }
  // Required: the key must be present AND non-empty. We can't use `.optional()`
  // here — that would let a *missing* key skip the check entirely. Instead the
  // outer preprocess keeps the key required, an emptiness guard rejects
  // undefined / null / "" / [] with the required message, and `.pipe(zod)` then
  // applies the field's real type + rules to whatever survives.
  return z.preprocess(
    emptyToUndef,
    z.any()
      .superRefine((v, ctx) => {
        if (v === undefined || (Array.isArray(v) && v.length === 0)) {
          ctx.addIssue({ code: "custom", message });
        }
      })
      .pipe(zod),
  );
}

function requiredMessage(field: FieldSchema): string {
  return field.validation?.find((r) => r.type === "required")?.message ?? "This field is required";
}

/** Resolve the inject handler for a field, by `type` then `meta.widget`. */
function resolveInjector(field: FieldSchema, options: SchemaToZodOptions): FieldValidator | undefined {
  const widget = field.meta?.widget as string | undefined;
  return options.inject?.[field.type] ?? (widget ? options.inject?.[widget] : undefined);
}

/** Returns the field's Zod type, or `null` to signal "strip this key". */
function fieldSchemaToZod(
  field: FieldSchema,
  depth: number,
  options: SchemaToZodOptions,
): z.ZodTypeAny | null {
  const widget = field.meta?.widget as string | undefined;
  const injector = resolveInjector(field, options);
  const isWidgetOrCustom = !!widget || !BUILTIN_LEAF.has(field.type);

  let base: z.ZodTypeAny;
  if (isWidgetOrCustom && !injector) {
    // Unmapped widget/custom field → policy decides.
    const policy = options.unknownField ?? "passthrough";
    if (policy === "error") throw new UnknownFieldError(field.name, widget ?? field.type);
    if (policy === "strip") return null;
    base = z.unknown(); // passthrough
  } else if (isWidgetOrCustom) {
    // Widget/custom WITH a handler — the injector defines the real shape.
    base = z.unknown();
  } else {
    base = builtinFieldToZod(field, depth, options);
  }

  // inject augments (via `base`) or replaces, for built-in and widget alike.
  return injector ? injector(field, base) : base;
}

function builtinFieldToZod(field: FieldSchema, depth: number, options: SchemaToZodOptions): z.ZodTypeAny {
  const rules = field.validation ?? [];
  switch (field.type) {
    case "input":
    case "textarea":
    case "password":
    case "phone":
      return applyStringRules(z.string(), rules);
    case "email":
      return applyStringRules(z.email(), rules);
    case "url":
      return applyStringRules(z.url(), rules);
    // Bounds come ONLY from `validation` rules — the renderer never enforces
    // `props.min`/`props.max`, so neither do we (add them via `inject`).
    case "number":
    case "slider":
      return applyNumberRules(z.number(), rules);
    case "select":
    case "radio": {
      const values = optionValues(field);
      return values.length ? z.enum(values as [string, ...string[]]) : z.string();
    }
    case "multiSelect": {
      const values = optionValues(field);
      return z.array(values.length ? z.enum(values as [string, ...string[]]) : z.string());
    }
    case "checkbox":
    case "switch":
      return z.boolean();
    case "datePicker":
      return z.string().regex(ISO_DATE, "Expected YYYY-MM-DD");
    case "timePicker":
      return z.string().regex(TIME, "Expected HH:mm");
    case "dateRange":
      return z.object({
        start: z.string().regex(ISO_DATE, "Expected YYYY-MM-DD").optional(),
        end: z.string().regex(ISO_DATE, "Expected YYYY-MM-DD").optional(),
      }).strip();
    // Files are uploaded separately; the persisted value is a reference string.
    case "file":
      return z.union([z.string(), z.array(z.string())]);
    case "hidden":
      return z.unknown();
    // array → a real nested array of its template fields (recurses to any depth).
    case "array": {
      let arr: z.ZodTypeAny = z.array(
        z.object(fieldsToShape(field.children ?? [], depth + 1, options)).strip(),
      );
      const minRows = numProp(field, "minRows");
      const maxRows = numProp(field, "maxRows");
      if (minRows > 0) arr = (arr as z.ZodArray<any>).min(minRows, `At least ${minRows} row${minRows !== 1 ? "s" : ""} required`);
      if (maxRows > 0) arr = (arr as z.ZodArray<any>).max(maxRows, `At most ${maxRows} row${maxRows !== 1 ? "s" : ""} allowed`);
      return arr;
    }
    default:
      // Unreachable — widgets/custom types are handled in fieldSchemaToZod.
      return z.unknown();
  }
}

function optionValues(field: FieldSchema): string[] {
  return (field.options ?? []).map((o) => o.value).filter((v): v is string => typeof v === "string");
}

function numProp(field: FieldSchema, key: string): number {
  const v = field.props?.[key];
  return typeof v === "number" ? v : 0;
}

function safeCompileRegex(value: unknown): RegExp | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_PATTERN_LENGTH) return null;
  try { return new RegExp(value); } catch { return null; }
}

function applyStringRules(initial: any, rules: ValidationRule[]): z.ZodTypeAny {
  const hasEmail = rules.some((r) => r.type === "email");
  const hasUrl = rules.some((r) => r.type === "url");
  let out: any = hasEmail ? z.email() : hasUrl ? z.url() : initial;
  for (const rule of rules) {
    switch (rule.type) {
      case "minLength": if (typeof rule.value === "number") out = out.min(rule.value, rule.message); break;
      case "maxLength": if (typeof rule.value === "number") out = out.max(rule.value, rule.message); break;
      case "pattern": { const re = safeCompileRegex(rule.value); if (re) out = out.regex(re, rule.message); break; }
      case "numeric": out = out.regex(NUM, rule.message); break;
      case "alphanumeric": out = out.regex(ALNUM, rule.message); break;
    }
  }
  return out;
}

function applyNumberRules(base: any, rules: ValidationRule[]): z.ZodTypeAny {
  let out = base;
  for (const rule of rules) {
    if (rule.type === "min" && typeof rule.value === "number") out = out.min(rule.value, rule.message);
    if (rule.type === "max" && typeof rule.value === "number") out = out.max(rule.value, rule.message);
  }
  return out;
}
