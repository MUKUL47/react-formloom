import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { getField, computeAllFields } from "../registry";
import { getWidget } from "../data-source";
import { useFormState } from "./useFormState";
import { FormField } from "./FormField";
import { Button } from "@/components/ui/button";
import {
  runPreloadHooks,
  runSubmitHooks,
  runSideEffectHooks,
  runGlobalPreloadHook,
  runGlobalSubmitHook,
  runGlobalValidateHook,
} from "./hooks";
import type { FormSchema, FieldSchema } from "../types";

// Ensure fields are registered
import "../fields";

const DISPLAY_TYPES = new Set([
  "divider",
  "heading",
  "paragraph",
  "hidden",
  "section",
  "columns",
  "array",
]);
/** Types that produce no data — stripped from submission */
const NO_DATA_TYPES = new Set(["divider", "heading", "paragraph"]);
const NO_LABEL_TYPES = new Set([
  "checkbox",
  "switch",
  "divider",
  "heading",
  "paragraph",
  "hidden",
  "section",
  "columns",
  "array",
  "tabs",
]);

/**
 * Recursively flatten all containers (tabs, sections) out of the submit values.
 * Tabs and sections are rendering-only — on submit everything becomes flat.
 * Only the active tab's fields are included.
 */
/**
 * Build a set of field names that are containers (tabs/sections) at any depth.
 * Used by flattenContainerValues to distinguish container objects from data objects.
 */
function collectContainerNames(fields: FieldSchema[]): Set<string> {
  const names = new Set<string>();
  for (const f of fields) {
    if (f.tabs) {
      names.add(f.name);
      for (const tab of f.tabs) {
        for (const n of collectContainerNames(tab.fields)) names.add(n);
      }
    }
    if (f.children && f.children.length > 0) {
      if (f.type !== "array") names.add(f.name); // array stays as array, don't flatten it
      for (const n of collectContainerNames(f.children)) names.add(n); // but DO collect its children's containers
    }
  }
  return names;
}

/**
 * Recursively flatten containers (tabs, sections) out of submit values.
 * Only keys in containerNames are treated as containers — data fields
 * like dateRange { start, end } are kept intact.
 */
function flattenContainerValues(
  rawValues: Record<string, unknown>,
  containerNames: Set<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawValues)) {
    // Only flatten keys that are known containers
    if (!containerNames.has(key)) {
      result[key] = value;
      continue;
    }

    // Tabs value: { activeTab: string, data: { ... } }
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "activeTab" in (value as any) &&
      "data" in (value as any)
    ) {
      const tabState = value as {
        activeTab: string;
        data: Record<string, unknown>;
      };
      const inner = flattenContainerValues(tabState.data ?? {}, containerNames);
      Object.assign(result, inner);
      continue;
    }

    // Section value: plain object
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const inner = flattenContainerValues(
        value as Record<string, unknown>,
        containerNames,
      );
      Object.assign(result, inner);
      continue;
    }

    result[key] = value;
  }

  return result;
}

interface FormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
  /** Called on every field change with current values */
  onValuesChange?: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
  submitLabel?: string;
  showReset?: boolean;
}

export function FormRenderer({
  schema,
  initialValues,
  onSubmit,
  onValuesChange,
  readOnly,
  submitLabel = "Submit",
  showReset = true,
}: FormRendererProps) {
  // Run per-field beforePreload hooks, then global beforePreload hook
  const preloadedValues = initialValues
    ? runGlobalPreloadHook(
        schema.globalHooks?.beforePreload,
        runPreloadHooks(schema.fields, initialValues),
      )
    : initialValues;

  const {
    values,
    errors: allErrors,
    setValue,
    validate,
    reset,
    getFieldError,
  } = useFormState(schema, preloadedValues);

  // Notify parent of value changes (flattened, consistent with onSubmit)
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;
  const containerNamesRef = useRef(collectContainerNames(schema.fields));
  containerNamesRef.current = collectContainerNames(schema.fields);
  useEffect(() => {
    if (!onValuesChangeRef.current) return;
    const flat = flattenContainerValues(values, containerNamesRef.current);
    onValuesChangeRef.current(flat);
  }, [values]);

  // Widget data — rich objects emitted by widgets (e.g. full selected option)
  // Stored as ref to avoid extra re-renders; read on next sideEffect recompute
  const widgetDataRef = useRef<Record<string, unknown>>({});
  const makeWidgetDataHandler = useCallback(
    (fieldName: string) => (data: unknown) => {
      widgetDataRef.current = { ...widgetDataRef.current, [fieldName]: data };
    },
    [],
  );

  // Side effects — run after preload, recompute on every value change
  const rawSideEffects = useMemo(
    () => runSideEffectHooks(schema.fields, values, widgetDataRef.current),
    [schema.fields, values],
  );
  // When the form is rendered in `readOnly` mode we used to slap
  // `pointer-events-none` on the wrapper as a kill switch — but that breaks
  // legitimate non-edit interactions like scrolling a long textarea,
  // selecting text to copy, or scrolling overflow containers. Instead, fold
  // every field (top-level + nested) into the `disabled` sideEffect so the
  // existing per-field disable pipeline naturally propagates everywhere.
  const sideEffects = useMemo(() => {
    if (!readOnly) return rawSideEffects;
    const allDisabled = new Set(rawSideEffects.disabled);
    for (const f of computeAllFields(schema.fields)) allDisabled.add(f.name);
    return { ...rawSideEffects, disabled: allDisabled };
  }, [rawSideEffects, readOnly, schema.fields]);

  // Apply overrides from side effects
  const appliedOverridesRef = useRef<string>("");
  useEffect(() => {
    const overrides = sideEffects.overrides;
    const keys = Object.keys(overrides);
    if (keys.length === 0) return;
    // Serialize to detect actual changes and avoid infinite loops
    const sig = JSON.stringify(overrides);
    if (sig === appliedOverridesRef.current) return;
    appliedOverridesRef.current = sig;
    for (const [key, val] of Object.entries(overrides)) {
      if (values[key] !== val) setValue(key, val);
    }
  }, [sideEffects.overrides, setValue, values]);

  const formRef = useRef<HTMLFormElement>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Find the chain of tabs that need to be activated to reach a field.
   * Returns array of { tabFieldName, tabKey } from outermost to innermost.
   * e.g. tab1 > tab22 > textarea → [{ tabFieldName: "outerTabs", tabKey: "tab1" }, { tabFieldName: "innerTabs", tabKey: "tab22" }]
   */
  const findTabChainForField = (
    fieldName: string,
    fields: typeof schema.fields,
    depth = 0,
  ): { tabFieldName: string; tabKey: string }[] => {
    if (depth >= 3) return [];
    for (const f of fields) {
      if (f.tabs) {
        for (const tab of f.tabs) {
          // Direct child match
          if (tab.fields.some((tf) => tf.name === fieldName)) {
            return [{ tabFieldName: f.name, tabKey: tab.key }];
          }
          // Recurse deeper — check inside tab's fields
          const deeper = findTabChainForField(fieldName, tab.fields, depth + 1);
          if (deeper.length > 0) {
            return [{ tabFieldName: f.name, tabKey: tab.key }, ...deeper];
          }
        }
      }
      if (f.children) {
        // Direct child match in section
        if (f.children.some((c) => c.name === fieldName)) return [];
        // Recurse into section children
        const deeper = findTabChainForField(fieldName, f.children, depth);
        if (deeper.length > 0) return deeper;
      }
    }
    return [];
  };

  const focusAndHighlight = (fieldName: string) => {
    if (!formRef.current) return;
    const el = formRef.current.querySelector<HTMLElement>(
      `[name="${fieldName}"], [id="${fieldName}"], [htmlfor="${fieldName}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in el) (el as HTMLElement).focus();
      // Add highlight ring animation
      const wrapper = el.closest("[data-field-name]") as HTMLElement | null;
      if (wrapper) {
        wrapper.classList.add("fc-error-highlight");
        setTimeout(() => wrapper.classList.remove("fc-error-highlight"), 2000);
      }
      return;
    }
    const label = formRef.current.querySelector<HTMLElement>(
      `label[for="${fieldName}"]`,
    );
    const parent = label?.closest("[data-field-name]") as HTMLElement | null;
    if (parent) {
      parent.scrollIntoView({ behavior: "smooth", block: "center" });
      parent.classList.add("fc-error-highlight");
      setTimeout(() => parent.classList.remove("fc-error-highlight"), 2000);
    }
  };

  const focusField = (fieldName: string) => {
    const chain = findTabChainForField(fieldName, schema.fields);
    if (chain.length === 0) {
      focusAndHighlight(fieldName);
      return;
    }

    // Deep-switch all tabs in the chain via a single setValue on the outermost container.
    // Walk from innermost to outermost, rebuilding the nested value with correct activeTab at each level.
    const outermost = chain[0];
    let needsSwitch = false;

    // Read current nested state and check if any tab needs switching
    let cursor = values[outermost.tabFieldName] as
      | { activeTab?: string; data?: Record<string, unknown> }
      | undefined;
    for (const { tabFieldName, tabKey } of chain) {
      const tv =
        tabFieldName === outermost.tabFieldName
          ? cursor
          : (cursor?.data?.[tabFieldName] as
              | { activeTab?: string; data?: Record<string, unknown> }
              | undefined);
      if (tv?.activeTab !== tabKey) needsSwitch = true;
      if (tabFieldName !== outermost.tabFieldName) cursor = tv;
    }

    if (needsSwitch) {
      // Rebuild from innermost outward
      const rebuild = (
        idx: number,
        parentData: Record<string, unknown>,
      ): Record<string, unknown> => {
        const { tabFieldName, tabKey } = chain[idx];
        const existing = parentData[tabFieldName] as
          | { activeTab?: string; data?: Record<string, unknown> }
          | undefined;
        const data = { ...(existing?.data ?? {}) };
        // Recurse deeper if more chain entries
        if (idx + 1 < chain.length) {
          const innerResult = rebuild(idx + 1, data);
          Object.assign(data, innerResult);
        }
        return { [tabFieldName]: { activeTab: tabKey, data } };
      };

      const newOuter = rebuild(0, values);
      setValue(outermost.tabFieldName, newOuter[outermost.tabFieldName]);
      // Wait for all nested tabs to re-render
      requestAnimationFrame(() =>
        setTimeout(() => focusAndHighlight(fieldName), 150),
      );
    } else {
      focusAndHighlight(fieldName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    // Skip validation for fields hidden by a sideEffect — they're stripped from
    // the payload anyway, so validating them would deadlock submit.
    const firstError = validate(sideEffects.hidden);

    // Check dynamically required fields from sideEffects
    const containerNames = collectContainerNames(schema.fields);
    const flatForCheck = flattenContainerValues(values, containerNames);
    let dynamicError: string | null = null;
    for (const name of sideEffects.required) {
      if (sideEffects.hidden.has(name)) continue; // hidden fields are excluded
      const val = flatForCheck[name];
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      ) {
        dynamicError = dynamicError ?? name;
      }
    }

    const errorToFocus = firstError ?? dynamicError;
    if (errorToFocus) {
      focusField(errorToFocus);
      return;
    }
    let finalValues = flattenContainerValues(values, containerNames);

    // Flatten containers inside array row objects
    const flattenArrayRows = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj)) {
        if (Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === "object" && !(val[0] instanceof File)) {
          result[key] = val.map((row) =>
            typeof row === "object" && row && !Array.isArray(row)
              ? flattenArrayRows(flattenContainerValues(row as Record<string, unknown>, containerNames))
              : row,
          );
        } else {
          result[key] = val;
        }
      }
      return result;
    };
    finalValues = flattenArrayRows(finalValues);

    // Global validate hook — runs after all field validations pass, on flattened values
    const gErr = runGlobalValidateHook(
      schema.globalHooks?.validate,
      finalValues,
    );
    if (gErr) {
      setGlobalError(gErr);
      return;
    }
    setGlobalError(null);

    // Remove hidden keys from submission (disabled keys are kept)
    for (const key of sideEffects.hidden) {
      delete finalValues[key];
    }

    // Remove display-only fields (dividers, headings, paragraphs) — they hold no data
    const stripDisplay = (fields: typeof schema.fields) => {
      for (const f of fields) {
        if (NO_DATA_TYPES.has(f.type)) delete finalValues[f.name];
        if (f.children) stripDisplay(f.children);
        if (f.tabs) for (const t of f.tabs) stripDisplay(t.fields);
      }
    };
    stripDisplay(schema.fields);

    // Per-field beforeSubmit hooks
    finalValues = runSubmitHooks(schema.fields, finalValues);
    // Global beforeSubmit hook — runs last
    finalValues = runGlobalSubmitHook(
      schema.globalHooks?.beforeSubmit,
      finalValues,
    );
    onSubmit?.(finalValues);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-5 overflow-y-auto"
    >
      <style>{`
        @keyframes fc-pulse-ring {
          0% { box-shadow: 0 0 0 0 hsl(var(--destructive) / 0.4); }
          50% { box-shadow: 0 0 0 6px hsl(var(--destructive) / 0.1); }
          100% { box-shadow: 0 0 0 0 hsl(var(--destructive) / 0); }
        }
        .fc-error-highlight {
          animation: fc-pulse-ring 0.8s ease-out 2;
          border-radius: 6px;
        }
      `}</style>
      {schema.fields.map((field) => {
        const def = getField(field.type);
        if (!def) return null;

        // Side effect: hide
        if (sideEffects.hidden.has(field.name)) return null;

        const { RuntimeComponent } = def;
        const error = getFieldError(field.name);
        const hideLabel = NO_LABEL_TYPES.has(field.type);
        const isDisplay = DISPLAY_TYPES.has(field.type);
        const isDisabledBySideEffect = sideEffects.disabled.has(field.name);
        const isDisabled = !!field.readOnly || isDisabledBySideEffect;

        if (isDisplay) {
          return (
            <RuntimeComponent
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={(v) => setValue(field.name, v)}
              error={error}
              allErrors={allErrors}
              sideEffects={{
                hidden: sideEffects.hidden,
                disabled: sideEffects.disabled,
                required: sideEffects.required,
              }}
            />
          );
        }

        // Resolve the component to render:
        // 1. meta.widget → custom widget replaces entire renderer
        // 2. default → standard RuntimeComponent
        // (meta.dataSource was dropped — a widget does the same job.)
        const widgetName = field.meta?.widget as string | undefined;
        const widgetConfig = widgetName ? getWidget(widgetName) : undefined;

        const fieldProps = {
          field,
          value: values[field.name],
          onChange: isDisabled
            ? () => {}
            : (v: unknown) => setValue(field.name, v),
          onWidgetDataChange: makeWidgetDataHandler(field.name),
          widgetDataFactory: makeWidgetDataHandler,
          error,
          disabled: isDisabled,
          allErrors,
          sideEffects: {
            hidden: sideEffects.hidden,
            disabled: sideEffects.disabled,
            required: sideEffects.required,
          },
        };

        let content: React.ReactNode;
        if (widgetConfig) {
          // Custom widget takes over entirely
          const WidgetComponent = widgetConfig.component;
          content = <WidgetComponent {...fieldProps} />;
        } else {
          content = <RuntimeComponent {...fieldProps} />;
        }

        return (
          <FormField
            key={field.id}
            label={field.label}
            name={field.name}
            required={field.required || sideEffects.required.has(field.name)}
            error={error}
            hideLabel={hideLabel}
            helpText={field.helpText}
            tooltip={field.tooltip}
          >
            {content}
          </FormField>
        );
      })}

      {globalError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5"
        >
          <span
            aria-hidden
            className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"
          />
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-destructive">
            {globalError}
          </p>
        </div>
      )}

      {!readOnly && onSubmit && schema.fields.length > 0 && (
        <div className="pt-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="default"
              className="h-10 px-5 text-[13px] font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {submitLabel}
            </Button>
            {showReset && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={reset}
                className="h-10 px-4 text-[13px] tracking-tight text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
