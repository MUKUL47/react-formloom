import { TextIcon } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
    {(field.props?.text as string) || field.label || "Paragraph text goes here..."}
  </p>
);

const RuntimeComponent = ({ field }: RuntimeFieldProps) => (
  <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
    {(field.props?.text as string) || field.label || "Paragraph text"}
  </p>
);

const def: FieldDefinition = {
  type: "paragraph",
  label: "Paragraph",
  icon: TextIcon,
  category: "display",
  defaultSchema: { label: "Paragraph", props: { text: "Add your descriptive text here." } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label (builder only)", type: "text" },
    { key: "props.text", label: "Content", type: "textarea" },
  ],
};

registerField(def);
