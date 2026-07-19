import { AlignLeft } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Textarea } from "@/components/ui/textarea";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Textarea disabled placeholder={field.placeholder || "Multi-line text..."} className="h-14 text-xs resize-none" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => (
  <Textarea
    id={field.name}
    name={field.name}
    placeholder={field.placeholder || field.label}
    rows={(field.props?.rows as number) ?? 3}
    value={(value as string) ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    aria-invalid={!!error}
    aria-describedby={error ? `${field.name}-error` : undefined}
    className={`resize-y leading-relaxed ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
  />
);

const def: FieldDefinition = {
  type: "textarea",
  label: "Text Area",
  icon: AlignLeft,
  category: "input",
  defaultSchema: { placeholder: "Enter long text...", props: { rows: 3 } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
