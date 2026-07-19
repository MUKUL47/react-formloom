import { getField } from "../registry";
import { getWidget } from "../data-source";
import { FormField } from "./FormField";
import type { FieldSchema } from "../types";

import "../fields";

const NO_LABEL = new Set(["checkbox", "switch", "divider", "heading", "paragraph", "hidden", "section", "columns", "array", "tabs"]);
const DISPLAY = new Set(["divider", "heading", "paragraph", "hidden"]);
const CONTAINER = new Set(["section", "columns", "array", "tabs"]);

/**
 * Renders a list of FieldSchema with full FormField wrapping
 * (label, required, tooltip, helpText, error, readOnly, widget, dataSource).
 * Used inside tabs and section runtime components so they behave
 * identically to the top-level FormRenderer.
 */
export function NestedFieldRenderer({
  fields,
  values,
  onChange,
  errors,
  sideEffects,
  onWidgetDataChange,
}: {
  fields: FieldSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  sideEffects?: { hidden: Set<string>; disabled: Set<string>; required: Set<string> };
  onWidgetDataChange?: (fieldName: string) => (data: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const def = getField(field.type);
        if (!def) return null;

        // Side effect: hide
        if (sideEffects?.hidden.has(field.name)) return null;

        const { RuntimeComponent } = def;
        const error = errors?.[field.name];
        const hideLabel = NO_LABEL.has(field.type);
        const isDisplay = DISPLAY.has(field.type);
        const isDisabledBySideEffect = !!sideEffects?.disabled.has(field.name);
        const isDisabled = !!field.readOnly || isDisabledBySideEffect;
        const handleChange = isDisabled ? () => {} : (v: unknown) => onChange(field.name, v);

        if (isDisplay) {
          return (
            <RuntimeComponent
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={handleChange}
              error={error}
              disabled={isDisabled}
            />
          );
        }

        // Containers: pass allErrors and sideEffects through
        if (CONTAINER.has(field.type)) {
          return (
            <RuntimeComponent
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={handleChange}
              error={error}
              allErrors={errors}
              sideEffects={sideEffects}
            />
          );
        }

        const widgetName = field.meta?.widget as string | undefined;
        const widgetConfig = widgetName ? getWidget(widgetName) : undefined;

        const fieldProps = {
          field,
          value: values[field.name],
          onChange: handleChange,
          onWidgetDataChange: onWidgetDataChange?.(field.name),
          error,
          disabled: isDisabled,
        };

        let content: React.ReactNode;
        if (widgetConfig) {
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
            required={field.required || !!sideEffects?.required.has(field.name)}
            error={error}
            hideLabel={hideLabel}
            helpText={field.helpText}
            tooltip={field.tooltip}
          >
            {content}
          </FormField>
        );
      })}
    </div>
  );
}
