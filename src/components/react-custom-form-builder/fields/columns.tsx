import { Columns2 } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { NestedFieldRenderer } from "../renderer/NestedFieldRenderer";

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const children = field.children ?? [];
  const cols = (field.props?.columns as number) ?? 2;
  return (
    <div className="rounded-md border border-border bg-muted/20 overflow-hidden" data-section-navigate="true">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border cursor-pointer pointer-events-auto hover:bg-accent transition-colors">
        <Columns2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{field.label || "Columns"}</span>
        <span className="text-[10px] text-muted-foreground">{cols}-col · {children.length} fields</span>
      </div>
      <div className="px-3 py-2 text-[10px] text-muted-foreground">
        Fields render in a {cols}-column grid
        <span className="ml-1 text-muted-foreground/50">— click header to enter</span>
      </div>
    </div>
  );
};

const RuntimeComponent = ({ field, value, onChange, allErrors, sideEffects, widgetDataFactory }: RuntimeFieldProps) => {
  const children = field.children ?? [];
  const cols = (field.props?.columns as number) ?? 2;
  const data = (value as Record<string, unknown>) ?? {};
  const gap = (field.props?.gap as number) ?? 4;

  const setFieldValue = (name: string, val: unknown) => onChange({ ...data, [name]: val });

  if (children.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No fields in this column layout</p>;
  }

  return (
    <div
      className="gap-x-4"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: `${gap * 4}px`,
      }}
    >
      {children.map((child) => {
        const span = (child.props?.colSpan as number) ?? 1;
        return (
          <div key={child.id} style={span > 1 ? { gridColumn: `span ${span}` } : undefined}>
            <NestedFieldRenderer
              fields={[child]}
              values={data}
              onChange={setFieldValue}
              errors={allErrors}
              sideEffects={sideEffects}
              onWidgetDataChange={widgetDataFactory}
            />
          </div>
        );
      })}
    </div>
  );
};

const def: FieldDefinition = {
  type: "columns",
  label: "Columns",
  icon: Columns2,
  category: "layout",
  defaultSchema: { children: [], props: { columns: 2, gap: 4 } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    {
      key: "props.columns",
      label: "Columns",
      type: "select",
      selectOptions: [
        { label: "2 columns", value: "2" },
        { label: "3 columns", value: "3" },
        { label: "4 columns", value: "4" },
      ],
    },
  ],
};

registerField(def);
