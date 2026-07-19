import { ListChecks } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
} from "@/components/ui/multi-select";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <div className="flex h-8 w-full items-center rounded-md border border-input bg-background px-3 text-xs text-muted-foreground">
      {field.placeholder || "Select multiple..."}
    </div>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => {
  const selected = (value as string[]) ?? [];

  // Read-only path — comma-joined resolved option labels, no MultiSelect chrome.
  // Falls back to raw value for any id that doesn't match a defined option.
  if (field.readOnly) {
    if (!selected.length) {
      return <span className="text-muted-foreground">&mdash;</span>;
    }
    const opts = field.options ?? [];
    const labels = selected.map(
      (v) => opts.find((o) => o.value === v)?.label ?? v,
    );
    return (
      <span className="text-foreground text-sm break-words">
        {labels.join(", ")}
      </span>
    );
  }

  return (
    <MultiSelect values={selected} onValuesChange={(v) => onChange(v)}>
      <MultiSelectTrigger
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`h-9 w-full ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
      >
        <MultiSelectValue placeholder={field.placeholder || "Select options…"} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        {(field.options ?? []).length === 0 ? (
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
              No Options
            </p>
          </div>
        ) : (
          (field.options ?? []).map((opt) => (
            <MultiSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </MultiSelectItem>
          ))
        )}
      </MultiSelectContent>
    </MultiSelect>
  );
};

const def: FieldDefinition = {
  type: "multiSelect",
  label: "Multi Select",
  icon: ListChecks,
  category: "selection",
  defaultSchema: {
    placeholder: "Select options...",
    defaultValue: [],
    options: [
      { label: "Option 1", value: "option1" },
      { label: "Option 2", value: "option2" },
      { label: "Option 3", value: "option3" },
    ],
  },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "options", label: "Options", type: "options-editor" },
  ],
};

registerField(def);
