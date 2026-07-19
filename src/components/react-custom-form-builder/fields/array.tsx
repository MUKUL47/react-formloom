import { ListPlus, Trash2 } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { NestedFieldRenderer } from "../renderer/NestedFieldRenderer";
import { Button } from "@/components/ui/button";

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const children = field.children ?? [];
  return (
    <div className="rounded-md border border-border bg-muted/20 overflow-hidden" data-section-navigate="true">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border cursor-pointer pointer-events-auto hover:bg-accent transition-colors">
        <ListPlus className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{field.label || "Array"}</span>
        <span className="text-[10px] text-muted-foreground">{children.length} template fields</span>
      </div>
      <div className="px-3 py-2 text-[10px] text-muted-foreground">
        Users can add/remove rows at runtime
        <span className="ml-1 text-muted-foreground/50">— click header to edit template</span>
      </div>
    </div>
  );
};

const RuntimeComponent = ({ field, value, onChange, allErrors, sideEffects, error, widgetDataFactory }: RuntimeFieldProps) => {
  const children = field.children ?? [];
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const minRows = (field.props?.minRows as number) ?? 0;
  const maxRows = (field.props?.maxRows as number) ?? 0; // 0 = unlimited
  const addLabel = (field.props?.addLabel as string) || "+";
  const description = field.props?.description as string;
  const arrayError = error ?? allErrors?.[field.name];

  const addRow = () => {
    const newRow: Record<string, unknown> = {};
    for (const child of children) {
      if (child.defaultValue !== undefined) newRow[child.name] = child.defaultValue;
    }
    onChange([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, childName: string, childValue: unknown) => {
    const next = rows.map((row, i) =>
      i === index ? { ...row, [childName]: childValue } : row,
    );
    onChange(next);
  };

  const canAdd = maxRows === 0 || rows.length < maxRows;
  const canRemove = rows.length > minRows;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{field.label || "Array"}</span>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          {arrayError && <p className="text-xs text-destructive mt-0.5">{arrayError}</p>}
        </div>
        <span className="text-xs text-muted-foreground">
          {rows.length} row{rows.length !== 1 ? "s" : ""}
          {maxRows > 0 && ` / ${maxRows} max`}
        </span>
      </div>

      {/* Rows */}
      {rows.map((row, index) => {
        // Extract errors for this row: "fieldName.0.childName" → "childName"
        const rowErrors: Record<string, string> = {};
        if (allErrors) {
          const prefix = `${field.name}.${index}.`;
          for (const [key, msg] of Object.entries(allErrors)) {
            if (key.startsWith(prefix)) {
              rowErrors[key.slice(prefix.length)] = msg;
            }
          }
        }

        return (
          <div
            key={index}
            className="rounded-lg border border-border/60 bg-card overflow-hidden"
          >
            {/* Row header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80 tabular-nums">
                Row {(index + 1).toString().padStart(2, "0")}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove row ${index + 1}`}
                  className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Row fields — clone with unique IDs so React doesn't merge rows */}
            <div className="p-3">
              <NestedFieldRenderer
                fields={children.map((c) => ({ ...c, id: `${c.id}_row${index}` }))}
                values={row}
                onChange={(childName, childValue) => updateRow(index, childName, childValue)}
                errors={rowErrors}
                sideEffects={sideEffects}
                onWidgetDataChange={widgetDataFactory}
              />
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 py-8 px-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">
            No Entries
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            {field.placeholder || `Add a ${field.label?.toLowerCase() || "row"} below to begin.`}
          </p>
        </div>
      )}

      {/* Add button */}
      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="w-full h-9 text-[12.5px] tracking-tight border-dashed focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {addLabel}
        </Button>
      )}
    </div>
  );
};

const def: FieldDefinition = {
  type: "array",
  label: "Array",
  icon: ListPlus,
  category: "layout",
  defaultSchema: {
    children: [],
    props: { description: "", minRows: 0, maxRows: 0, addLabel: "+" },
  },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Title", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.description", label: "Description", type: "text" },
    { key: "props.minRows", label: "Min Rows", type: "number" },
    { key: "props.maxRows", label: "Max Rows (0 = unlimited)", type: "number" },
    { key: "props.addLabel", label: "Add Button Label", type: "text" },
  ],
};

registerField(def);
