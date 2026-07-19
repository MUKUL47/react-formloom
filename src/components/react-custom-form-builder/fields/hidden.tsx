import { EyeOff } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Badge } from "@/components/ui/badge";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="flex items-center gap-2 py-1">
    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">hidden</Badge>
    {field.defaultValue !== undefined && (
      <span className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[120px]">
        = {String(field.defaultValue)}
      </span>
    )}
  </div>
);

const RuntimeComponent = ({ field, value, onChange }: RuntimeFieldProps) => (
  <input type="hidden" name={field.name} value={(value as string) ?? ""} />
);

const def: FieldDefinition = {
  type: "hidden",
  label: "Hidden Field",
  icon: EyeOff,
  category: "layout",
  defaultSchema: { defaultValue: "" },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label (builder only)", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "defaultValue", label: "Value", type: "text" },
  ],
};

registerField(def);
