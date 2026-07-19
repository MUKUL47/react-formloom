import { Hash } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Input disabled type="number" placeholder="0" className="h-8 text-xs" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <Input
    id={field.name}
    name={field.name}
    type="number"
    placeholder={field.placeholder || field.label}
    value={(value as string | number) ?? ""}
    onChange={(e) => {
      const v = e.target.value;
      onChange(v === "" ? undefined : Number(v));
    }}
    disabled={disabled}
    inputMode="numeric"
    aria-invalid={!!error}
    aria-describedby={error ? `${field.name}-error` : undefined}
    className={`font-mono tabular-nums ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
  />
);

const def: FieldDefinition = {
  type: "number",
  label: "Number",
  icon: Hash,
  category: "input",
  defaultSchema: { placeholder: "Enter number..." },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
