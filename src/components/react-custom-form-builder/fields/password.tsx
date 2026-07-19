import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Input disabled type="password" placeholder="••••••••" className="h-8 text-xs" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={field.name}
        name={field.name}
        type={show ? "text" : "password"}
        placeholder={field.placeholder || field.label}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="current-password"
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={`pr-10 font-mono ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-[background-color,color] duration-150"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const def: FieldDefinition = {
  type: "password",
  label: "Password",
  icon: Lock,
  category: "input",
  defaultSchema: { placeholder: "Enter password..." },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
