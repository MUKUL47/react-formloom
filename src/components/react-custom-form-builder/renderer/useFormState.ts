import { useState, useCallback, useRef } from "react";
import type { FormSchema, FieldSchema, ValidationRule } from "../types";
import { runValidateHooks } from "./hooks";

interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

/** Walk schema recursively to collect all data fields (inside sections, tabs).
 *  When skipArrayChildren=true, don't recurse into array template children
 *  (those are validated separately per-row). */
function collectAllDataFields(fields: FieldSchema[], skipArrayChildren = false): FieldSchema[] {
  const result: FieldSchema[] = [];
  for (const f of fields) {
    result.push(f);
    if (f.type === "array" && skipArrayChildren) continue;
    if (f.children) result.push(...collectAllDataFields(f.children, skipArrayChildren));
    if (f.tabs) {
      for (const tab of f.tabs) {
        result.push(...collectAllDataFields(tab.fields, skipArrayChildren));
      }
    }
  }
  return result;
}

/**
 * Resolve the value for a nested field by walking into container values.
 * Sections store data as `values[sectionName][childName]`.
 * Tabs store data as `values[tabName].data[childName]`.
 * Top-level fields store as `values[fieldName]`.
 */
function resolveNestedValue(
  fieldName: string,
  topValues: Record<string, unknown>,
  fields: FieldSchema[],
): unknown {
  // First check top-level
  if (fieldName in topValues) return topValues[fieldName];

  // Walk containers to find the field
  for (const f of fields) {
    if (f.children && f.type !== "array") {
      const sectionData = (topValues[f.name] as Record<string, unknown>) ?? {};
      if (fieldName in sectionData) return sectionData[fieldName];
      // Recurse deeper
      const deeper = resolveNestedValue(fieldName, sectionData, f.children);
      if (deeper !== undefined) return deeper;
    }
    if (f.tabs) {
      const tabState = topValues[f.name] as { activeTab?: string; data?: Record<string, unknown> } | undefined;
      const tabData = tabState?.data ?? {};
      if (fieldName in tabData) return tabData[fieldName];
      for (const tab of f.tabs) {
        const deeper = resolveNestedValue(fieldName, tabData, tab.fields);
        if (deeper !== undefined) return deeper;
      }
    }
  }

  return undefined;
}

const URL_RE = /^https?:\/\/.+\..+/;
const NUMERIC_RE = /^\d+$/;
const ALPHANUM_RE = /^[a-zA-Z0-9]+$/;

function runValidation(
  value: unknown,
  rules: ValidationRule[] | undefined,
  required?: boolean,
): string | undefined {
  // Required check
  if (required || rules?.some((r) => r.type === "required")) {
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    if (empty) {
      const msg = rules?.find((r) => r.type === "required")?.message;
      return msg ?? "This field is required";
    }
  }

  if (!rules || value === undefined || value === null || value === "") return undefined;

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        break; // already handled above

      case "minLength":
        if (typeof value === "string" && value.length < (rule.value as number))
          return rule.message;
        break;
      case "maxLength":
        if (typeof value === "string" && value.length > (rule.value as number))
          return rule.message;
        break;
      case "min":
        if (typeof value === "number" && value < (rule.value as number))
          return rule.message;
        break;
      case "max":
        if (typeof value === "number" && value > (rule.value as number))
          return rule.message;
        break;
      case "pattern":
        if (typeof value === "string" && !new RegExp(rule.value as string).test(value))
          return rule.message;
        break;
      case "email":
        if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return rule.message;
        break;
      case "url":
        if (typeof value === "string" && !URL_RE.test(value))
          return rule.message;
        break;
      case "numeric":
        if (typeof value === "string" && !NUMERIC_RE.test(value))
          return rule.message;
        break;
      case "alphanumeric":
        if (typeof value === "string" && !ALPHANUM_RE.test(value))
          return rule.message;
        break;

      // ── File validations ──────────────────────────────────
      case "fileMaxSize": {
        const maxBytes = (rule.value as number) * 1024 * 1024; // MB → bytes
        if (Array.isArray(value)) {
          const tooBig = (value as File[]).find((f) => f.size > maxBytes);
          if (tooBig) return rule.message || `File "${tooBig.name}" exceeds ${rule.value}MB`;
        }
        break;
      }
      case "fileTypes": {
        const allowed = (rule.value as string).split(",").map((s) => s.trim().toLowerCase());
        if (Array.isArray(value)) {
          for (const f of value as File[]) {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            const mime = f.type.toLowerCase();
            if (!allowed.some((a) => a === `.${ext}` || a === ext || a === mime))
              return rule.message || `"${f.name}" is not an allowed file type`;
          }
        }
        break;
      }
      case "fileMinCount": {
        if (Array.isArray(value) && value.length < (rule.value as number))
          return rule.message || `At least ${rule.value} file(s) required`;
        break;
      }
      case "fileMaxCount": {
        if (Array.isArray(value) && value.length > (rule.value as number))
          return rule.message || `At most ${rule.value} file(s) allowed`;
        break;
      }
    }
  }

  return undefined;
}

/**
 * Hydrate initial values into the nested container structure expected by the renderer.
 * Flat data like { city: "X", input_123: "Y" } gets nested into
 * { tabs_abc: { activeTab: "tab1", data: { input_123: "Y" } }, city: "X" }
 */
function hydrateValues(
  fields: FieldSchema[],
  flat: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.tabs) {
      // Tabs: nest child values recursively into { activeTab, data: { ...childValues } }
      const data: Record<string, unknown> = {};
      for (const tab of field.tabs) {
        Object.assign(data, hydrateValues(tab.fields, flat));
      }
      values[field.name] = flat[field.name] ?? {
        activeTab: field.tabs[0]?.key ?? "",
        data,
      };
    } else if (field.type === "array") {
      // Array: use existing array or empty
      let existing = flat[field.name];
      // Handle stringified JSON from DB
      if (typeof existing === "string") {
        try { existing = JSON.parse(existing); } catch { /* ignore */ }
      }
      // Re-hydrate each row through the children schema so flat row data
      // gets nested back into columns/sections containers
      const rows = Array.isArray(existing) ? existing : [];
      values[field.name] = field.children?.length
        ? rows.map((row) =>
            typeof row === "object" && row && !Array.isArray(row)
              ? hydrateValues(field.children!, row as Record<string, unknown>)
              : row,
          )
        : rows;
    } else if (field.children && field.children.length > 0) {
      // Section/columns: nest child values recursively
      values[field.name] = flat[field.name] ?? hydrateValues(field.children, flat);
    } else {
      values[field.name] = flat[field.name] ?? field.defaultValue ?? undefined;
    }
  }
  return values;
}

export function useFormState(schema: FormSchema, initialValues?: Record<string, unknown>) {
  const [state, setState] = useState<FormState>(() => {
    const values = hydrateValues(schema.fields, initialValues ?? {});
    return { values, errors: {}, touched: {} };
  });

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const setValue = useCallback((name: string, value: unknown) => {
    setState((prev) => {
      const nextValues = { ...prev.values, [name]: value };
      const nextTouched = { ...prev.touched, [name]: true };
      const nextErrors = { ...prev.errors };
      const allFields = collectAllDataFields(schemaRef.current.fields);

      // Determine which fields to validate:
      // - If it's a plain data field, validate just that field
      // - If it's a container (section/tabs), validate its children that were touched
      const containerField = schemaRef.current.fields.find((f) => f.name === name && (f.type === "section" || f.type === "columns" || f.type === "array" || f.type === "tabs"));
      let fieldsToValidate: FieldSchema[] = [];

      if (containerField) {
        // Collect all child data fields of this container
        const children = collectAllDataFields(containerField.children ?? []);
        const tabChildren = containerField.tabs?.flatMap((t) => collectAllDataFields(t.fields)) ?? [];
        fieldsToValidate = [...children, ...tabChildren].filter(
          (f) => f.type !== "section" && f.type !== "tabs" && f.type !== "divider" && f.type !== "heading" && f.type !== "paragraph",
        );
        // Mark child fields as touched based on whether they have a value now
        for (const cf of fieldsToValidate) {
          const childVal = resolveNestedValue(cf.name, nextValues, schemaRef.current.fields);
          if (childVal !== undefined && childVal !== null && childVal !== "") {
            nextTouched[cf.name] = true;
          }
        }
        // Only validate touched children
        fieldsToValidate = fieldsToValidate.filter((f) => nextTouched[f.name]);
      } else {
        const field = allFields.find((f) => f.name === name);
        if (field) fieldsToValidate = [field];
      }

      // Build flat values for hook context
      const flatValues: Record<string, unknown> = {};
      for (const f of allFields) {
        flatValues[f.name] = resolveNestedValue(f.name, nextValues, schemaRef.current.fields);
      }

      // Validate each field
      for (const field of fieldsToValidate) {
        const val = flatValues[field.name] ?? resolveNestedValue(field.name, nextValues, schemaRef.current.fields);
        const err = runValidation(val, field.validation, field.required);
        if (err) {
          nextErrors[field.name] = err;
        } else {
          const hookResult = runValidateHooks([field], flatValues);
          if (hookResult[field.name]) {
            nextErrors[field.name] = hookResult[field.name];
          } else {
            delete nextErrors[field.name];
          }
        }
      }

      return { values: nextValues, errors: nextErrors, touched: nextTouched };
    });
  }, []);

  /** Returns null if valid, or the first error field name if invalid */
  const validate = useCallback((hidden?: Set<string>): string | null => {
    const errors: Record<string, string> = {};

    // Walk the full schema tree, resolving values from the correct scope at each level
    const validateScope = (fields: FieldSchema[], scopeValues: Record<string, unknown>, prefix: string) => {
      for (const f of fields) {
        if (f.type === "divider" || f.type === "heading" || f.type === "paragraph") continue;
        // Fields hidden by a sideEffect are excluded from the payload, so they
        // must NOT be validated — otherwise a hidden `required` field would
        // block submit and try to focus an invisible field (a deadlock).
        if (hidden?.has(f.name)) continue;

        if (f.type === "array") {
          const rows = scopeValues[f.name] as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(rows)) continue;
          const minRows = (f.props?.minRows as number) ?? 0;
          const maxRows = (f.props?.maxRows as number) ?? 0;
          if (minRows > 0 && rows.length < minRows) errors[`${prefix}${f.name}`] = `At least ${minRows} row${minRows !== 1 ? "s" : ""} required`;
          if (maxRows > 0 && rows.length > maxRows) errors[`${prefix}${f.name}`] = `At most ${maxRows} row${maxRows !== 1 ? "s" : ""} allowed`;
          // Validate each row's children (flat, one level)
          for (let i = 0; i < rows.length; i++) {
            for (const child of f.children ?? []) {
              if (child.type === "divider" || child.type === "heading" || child.type === "paragraph") continue;
              const val = rows[i][child.name];
              const err = runValidation(val, child.validation, child.required);
              if (err) errors[`${prefix}${f.name}.${i}.${child.name}`] = err;
            }
          }
          continue;
        }
        if (f.type === "section" || f.type === "columns") {
          const data = (scopeValues[f.name] as Record<string, unknown>) ?? {};
          validateScope(f.children ?? [], data, prefix);
          continue;
        }
        if (f.type === "tabs" && f.tabs) {
          const tabState = scopeValues[f.name] as { data?: Record<string, unknown> } | undefined;
          const tabData = tabState?.data ?? {};
          for (const tab of f.tabs) validateScope(tab.fields, tabData, prefix);
          continue;
        }

        // Leaf field — validate
        const val = scopeValues[f.name];
        const err = runValidation(val, f.validation, f.required);
        if (err) errors[`${prefix}${f.name}`] = err;
      }
    };
    validateScope(schemaRef.current.fields, state.values, "");

    // Custom validate hooks (top-level + non-array nested fields)
    const allFields = collectAllDataFields(schemaRef.current.fields, true);
    const flatValues: Record<string, unknown> = {};
    for (const field of allFields) {
      if (field.type === "section" || field.type === "columns" || field.type === "tabs" || field.type === "array") continue;
      flatValues[field.name] = resolveNestedValue(field.name, state.values, schemaRef.current.fields);
    }
    const hookErrors = runValidateHooks(allFields, flatValues);
    for (const [name, msg] of Object.entries(hookErrors)) {
      if (!errors[name] && !hidden?.has(name)) errors[name] = msg;
    }

    setState((prev) => ({ ...prev, errors }));
    const keys = Object.keys(errors);
    return keys.length > 0 ? keys[0] : null;
  }, [state.values]);

  const reset = useCallback(() => {
    const values = hydrateValues(schemaRef.current.fields, initialValues ?? {});
    setState({ values, errors: {}, touched: {} });
  }, [initialValues]);

  /** Returns error only if field has been touched or full validation ran (submit) */
  const getFieldError = useCallback(
    (name: string) => state.errors[name],
    [state.errors],
  );

  return { values: state.values, errors: state.errors, touched: state.touched, setValue, validate, reset, getFieldError };
}
