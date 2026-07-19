import { Link } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Input disabled type="url" placeholder={field.placeholder || "https://..."} className="h-8 text-xs" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <Input
    id={field.name}
    name={field.name}
    type="url"
    placeholder={field.placeholder || field.label}
    value={(value as string) ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    autoComplete="url"
    inputMode="url"
    aria-invalid={!!error}
    aria-describedby={error ? `${field.name}-error` : undefined}
    className={`font-mono ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
  />
);

const def: FieldDefinition = {
  type: "url",
  label: "URL",
  icon: Link,
  category: "input",
  defaultSchema: { placeholder: "https://example.com" },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
