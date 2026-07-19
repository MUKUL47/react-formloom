import { SlidersHorizontal } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Slider } from "@/components/ui/slider";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <Slider disabled defaultValue={[50]} max={100} className="py-1" />
  </div>
);

const RuntimeComponent = ({ field, value, onChange, disabled }: RuntimeFieldProps) => {
  const min = (field.props?.min as number) ?? 0;
  const max = (field.props?.max as number) ?? 100;
  const step = (field.props?.step as number) ?? 1;
  const current = (value as number) ?? min;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span className="font-medium text-foreground">{current}</span>
        <span>{max}</span>
      </div>
      <Slider
        value={[current]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
    </div>
  );
};

const def: FieldDefinition = {
  type: "slider",
  label: "Slider",
  icon: SlidersHorizontal,
  category: "input",
  defaultSchema: { defaultValue: 50, props: { min: 0, max: 100, step: 1 } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
