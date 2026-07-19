import { Heading } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const level = (field.props?.level as string) ?? "h3";
  const Tag = level as any;
  const sizes: Record<string, string> = {
    h1: "text-2xl font-bold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-semibold",
    h4: "text-base font-medium",
    h5: "text-sm font-medium",
  };
  return <Tag className={sizes[level] ?? sizes.h3}>{field.label || "Heading"}</Tag>;
};

const RuntimeComponent = ({ field }: RuntimeFieldProps) => {
  const level = (field.props?.level as string) ?? "h3";
  const Tag = level as any;
  const sizes: Record<string, string> = {
    h1: "text-2xl font-bold tracking-tight",
    h2: "text-xl font-semibold tracking-tight",
    h3: "text-lg font-semibold tracking-tight",
    h4: "text-base font-semibold tracking-tight",
    h5: "text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90",
  };
  return <Tag className={sizes[level] ?? sizes.h3}>{field.label || "Heading"}</Tag>;
};

const def: FieldDefinition = {
  type: "heading",
  label: "Heading",
  icon: Heading,
  category: "display",
  defaultSchema: { label: "Section Title", props: { level: "h3" } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Text", type: "text" },
    {
      key: "props.level",
      label: "Level",
      type: "select",
      selectOptions: [
        { label: "H1 — Large", value: "h1" },
        { label: "H2 — Medium", value: "h2" },
        { label: "H3 — Default", value: "h3" },
        { label: "H4 — Small", value: "h4" },
        { label: "H5 — XSmall", value: "h5" },
      ],
    },
  ],
};

registerField(def);
