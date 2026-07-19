import { Mail } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Input disabled type="email" placeholder={field.placeholder || "you@example.com"} className="h-8 text-xs" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <Input
    id={field.name}
    name={field.name}
    type="email"
    placeholder={field.placeholder || field.label}
    value={(value as string) ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    aria-invalid={!!error}
    aria-describedby={error ? `${field.name}-error` : undefined}
    autoComplete="email"
    inputMode="email"
    className={error ? "border-destructive focus-visible:ring-destructive/40" : ""}
  />
);

const def: FieldDefinition = {
  type: "email",
  label: "Email",
  icon: Mail,
  category: "input",
  defaultSchema: {
    placeholder: "you@example.com",
    validation: [{ type: "email", message: "Enter a valid email address" }],
  },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
