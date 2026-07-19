import { ChevronDown } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Select disabled>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={field.placeholder || "Select..."} />
      </SelectTrigger>
    </Select>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => {
  // Read-only path — just the resolved option label, no Select chrome.
  // Falls back to the raw value when it doesn't match any option.
  if (field.readOnly) {
    if (value == null || value === "") {
      return <span className="text-muted-foreground">&mdash;</span>;
    }
    const opt = (field.options ?? []).find((o) => o.value === String(value));
    return (
      <span className="text-foreground text-sm">
        {opt?.label ?? String(value)}
      </span>
    );
  }

  return (
    <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)} disabled={disabled}>
      <SelectTrigger
        id={field.name}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`h-9 ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
      >
        <SelectValue placeholder={field.placeholder || "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {(field.options ?? []).length === 0 ? (
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
              No Options
            </p>
          </div>
        ) : (
          (field.options ?? []).map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

const def: FieldDefinition = {
  type: "select",
  label: "Dropdown",
  icon: ChevronDown,
  category: "selection",
  defaultSchema: {
    placeholder: "Select an option...",
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
