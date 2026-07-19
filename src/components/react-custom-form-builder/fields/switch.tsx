import { ToggleRight } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="flex items-center gap-2">
    <Switch disabled />
    <span className="text-xs text-muted-foreground">{field.label}</span>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, disabled }: RuntimeFieldProps) => (
  <div className="flex items-center gap-3">
    <Switch
      id={field.id}
      checked={!!value}
      onCheckedChange={(checked) => onChange(checked)}
      disabled={disabled}
    />
    <Label htmlFor={field.id} className="text-sm cursor-pointer">
      {field.label}
    </Label>
  </div>
);

const def: FieldDefinition = {
  type: "switch",
  label: "Toggle Switch",
  icon: ToggleRight,
  category: "selection",
  defaultSchema: { defaultValue: false },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
