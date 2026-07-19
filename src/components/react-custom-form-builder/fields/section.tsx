import { useState } from "react";
import { PanelTop, ChevronDown, ChevronRight } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { NestedFieldRenderer } from "../renderer/NestedFieldRenderer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const children = field.children ?? [];
  return (
    <div className="rounded-md border border-border bg-muted/20 overflow-hidden" data-section-navigate="true">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border cursor-pointer pointer-events-auto hover:bg-accent transition-colors">
        <PanelTop className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{field.label || "Section"}</span>
        <span className="text-[10px] text-muted-foreground">{children.length} fields</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="px-3 py-2 text-[10px] text-muted-foreground">
        {(field.props?.description as string) || "Collapsible section"}
        <span className="ml-1 text-muted-foreground/50">— click header to enter</span>
      </div>
    </div>
  );
};

const RuntimeComponent = ({ field, value, onChange, allErrors, sideEffects, widgetDataFactory }: RuntimeFieldProps) => {
  const [open, setOpen] = useState(!(field.props?.collapsed as boolean));
  const description = field.props?.description as string;
  const children = field.children ?? [];
  const data = (value as Record<string, unknown>) ?? {};

  const setFieldValue = (name: string, val: unknown) => onChange({ ...data, [name]: val });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <CollapsibleTrigger
          aria-label={`${open ? "Collapse" : "Expand"} ${field.label || "section"}`}
          className="group/section flex items-center gap-3 w-full px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-[background-color] duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground/70 shrink-0 transition-transform duration-200" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground/70 shrink-0 transition-transform duration-200" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-semibold tracking-tight text-foreground">
              {field.label || "Section"}
            </span>
            {description && (
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
          <span className="font-mono text-[10px] font-semibold tabular-nums text-muted-foreground/60 shrink-0">
            {children.length.toString().padStart(2, "0")}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 border-t border-border/60">
            {children.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
                  Empty Section
                </p>
              </div>
            ) : (
              <NestedFieldRenderer
                fields={children}
                values={data}
                onChange={setFieldValue}
                errors={allErrors}
                sideEffects={sideEffects}
                onWidgetDataChange={widgetDataFactory}
              />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const def: FieldDefinition = {
  type: "section",
  label: "Section",
  icon: PanelTop,
  category: "layout",
  defaultSchema: { children: [], props: { description: "", collapsed: false } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Title", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.description", label: "Description", type: "text" },
    { key: "props.collapsed", label: "Start collapsed", type: "boolean" },
  ],
};

registerField(def);
