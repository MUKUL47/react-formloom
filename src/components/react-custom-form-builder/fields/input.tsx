import { Type } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Input disabled placeholder={field.placeholder || "Text input..."} className="h-8 text-xs" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <Input
    id={field.name}
    name={field.name}
    type="text"
    placeholder={field.placeholder || field.label}
    value={(value as string) ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    aria-invalid={!!error}
    aria-describedby={error ? `${field.name}-error` : undefined}
    className={error ? "border-destructive focus-visible:ring-destructive/40" : ""}
  />
);

const def: FieldDefinition = {
  type: "input",
  label: "Text Input",
  icon: Type,
  category: "input",
  defaultSchema: { placeholder: "Enter text..." },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
