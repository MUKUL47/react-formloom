import { Minus } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Separator } from "@/components/ui/separator";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="py-2">
    {field.label && field.label !== "Divider" && (
      <span className="text-[10px] text-muted-foreground mb-1 block">{field.label}</span>
    )}
    <Separator />
  </div>
);

const RuntimeComponent = ({ field }: RuntimeFieldProps) => {
  const hasLabel = field.label && field.label !== "Divider";
  if (hasLabel) {
    return (
      <div
        className="flex items-center gap-3 py-1"
        role="separator"
        aria-label={field.label}
      >
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/80 shrink-0">
          {field.label}
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
    );
  }
  return (
    <div className="py-1">
      <Separator />
    </div>
  );
};

const def: FieldDefinition = {
  type: "divider",
  label: "Divider",
  icon: Minus,
  category: "layout",
  defaultSchema: {},
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label (optional)", type: "text" },
  ],
};

registerField(def);
