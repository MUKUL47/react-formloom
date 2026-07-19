import { CalendarRange } from "lucide-react";
import { registerField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { Input } from "@/components/ui/input";

const CanvasComponent = ({ field }: CanvasFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{field.label}</span>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 h-9 flex-1 rounded-md border border-input bg-card/80 px-3 text-sm text-muted-foreground shadow-sm">
        <CalendarRange className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        <span>Start date</span>
      </div>
      <span className="text-xs text-muted-foreground">to</span>
      <div className="flex items-center gap-2 h-9 flex-1 rounded-md border border-input bg-card/80 px-3 text-sm text-muted-foreground shadow-sm">
        <span>End date</span>
      </div>
    </div>
  </div>
);

const RuntimeComponent = ({ field, value, onChange, error, disabled }: RuntimeFieldProps) => {
  const range = (value as { start: string; end: string }) ?? { start: "", end: "" };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <CalendarRange
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none"
          aria-hidden
        />
        <Input
          id={`${field.name}-start`}
          name={`${field.name}-start`}
          type="date"
          value={range.start}
          onChange={(e) => onChange({ ...range, start: e.target.value })}
          disabled={disabled}
          aria-label={`${field.label || field.name} start date`}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.name}-error` : undefined}
          className={`h-9 pl-9 font-mono tabular-nums ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
        />
      </div>
      <span
        aria-hidden
        className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/70 px-1"
      >
        to
      </span>
      <div className="relative flex-1">
        <CalendarRange
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none"
          aria-hidden
        />
        <Input
          id={`${field.name}-end`}
          name={`${field.name}-end`}
          type="date"
          value={range.end}
          onChange={(e) => onChange({ ...range, end: e.target.value })}
          disabled={disabled}
          aria-label={`${field.label || field.name} end date`}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.name}-error` : undefined}
          className={`h-9 pl-9 font-mono tabular-nums ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
        />
      </div>
    </div>
  );
};

const def: FieldDefinition = {
  type: "dateRange",
  label: "Date Range",
  icon: CalendarRange,
  category: "input",
  defaultSchema: { defaultValue: { start: "", end: "" } },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
  ],
};

registerField(def);
