import { Calendar } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <div className="flex items-center gap-2 h-9 w-full rounded-md border border-input bg-card/80 px-3 text-sm text-muted-foreground shadow-sm">
      <Calendar className="h-4 w-4 text-muted-foreground/60" />
      <span>Pick a date...</span>
    </div>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <div className="relative">
    <Calendar
      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none"
      aria-hidden
    />
    <Input
      id={field.name}
      name={field.name}
      type="date"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${field.name}-error` : undefined}
      className={`h-9 pl-9 font-mono tabular-nums ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
    />
  </div>
);

const def: FieldDefinition = {
  type: "datePicker",
  label: "Date Picker",
  icon: Calendar,
  category: "input",
  defaultSchema: {},
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
