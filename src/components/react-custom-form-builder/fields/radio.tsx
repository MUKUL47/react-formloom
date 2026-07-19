import { CircleDot } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <div className="space-y-1.5">
      {(field.options ?? []).slice(0, 3).map((opt) => (
        <div key={opt.value} className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">{opt.label}</span>
        </div>
      ))}
      {(field.options ?? []).length > 3 && (
        <span className="text-[10px] text-muted-foreground">+{(field.options ?? []).length - 3} more</span>
      )}
    </div>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, disabled }: RuntimeFieldProps) => (
  <RadioGroup
    value={(value as string) ?? ""}
    onValueChange={(v) => onChange(v)}
    disabled={disabled}
  >
    {(field.options ?? []).map((opt) => (
      <div key={opt.value} className="flex items-center gap-2">
        <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
        <Label htmlFor={`${field.id}-${opt.value}`} className="text-sm cursor-pointer font-normal">
          {opt.label}
        </Label>
      </div>
    ))}
  </RadioGroup>
);

const def: FieldDefinition = {
  type: "radio",
  label: "Radio Group",
  icon: CircleDot,
  category: "selection",
  defaultSchema: {
    options: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
      { label: "Option C", value: "c" },
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
