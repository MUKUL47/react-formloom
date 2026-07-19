import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { TabDefinition, FieldSchema, FieldType } from "../types";
import { getAllFields, generateFieldId } from "../registry";

const ALLOWED_TAB_FIELD_TYPES: FieldType[] = [
  "input", "textarea", "number", "password", "email", "phone", "url",
  "select", "multiSelect", "radio", "checkbox", "switch", "slider",
  "datePicker", "timePicker", "file",
];

interface TabsEditorProps {
  tabs: TabDefinition[];
  onChange: (tabs: TabDefinition[]) => void;
}

function TabFieldEditor({
  field,
  onUpdate,
  onRemove,
}: {
  field: FieldSchema;
  onUpdate: (changes: Partial<FieldSchema>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const allDefs = getAllFields();
  const allowedDefs = allDefs.filter((d) => ALLOWED_TAB_FIELD_TYPES.includes(d.type));

  return (
    <div className="rounded-md border border-border/60">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${field.label}`}
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/40 transition-[background-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
        )}
        <span className="text-[12px] tracking-tight flex-1 truncate">{field.label}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 font-mono">
          {field.type}
        </span>
        <button
          type="button"
          aria-label={`Remove ${field.label}`}
          className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="px-2 pb-2 pt-1.5 space-y-2 border-t border-border/40">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium tracking-tight text-muted-foreground">Type</Label>
            <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as FieldType })}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedDefs.map((d) => (
                  <SelectItem key={d.type} value={d.type}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium tracking-tight text-muted-foreground">Label</Label>
            <Input
              className="h-8 text-[12px]"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium tracking-tight text-muted-foreground">Field Name</Label>
            <Input
              className="h-8 text-[12px] font-mono tabular-nums"
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium tracking-tight text-muted-foreground">Placeholder</Label>
            <Input
              className="h-8 text-[12px]"
              value={field.placeholder ?? ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SingleTabEditor({
  tab,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  tab: TabDefinition;
  index: number;
  onUpdate: (updated: TabDefinition) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  const addField = () => {
    const id = generateFieldId();
    const newField: FieldSchema = {
      id,
      name: `${tab.key}_field${tab.fields.length + 1}`,
      type: "input",
      label: `Field ${tab.fields.length + 1}`,
      placeholder: "Enter...",
    };
    onUpdate({ ...tab, fields: [...tab.fields, newField] });
  };

  const updateField = (fieldIndex: number, changes: Partial<FieldSchema>) => {
    const fields = tab.fields.map((f, i) =>
      i === fieldIndex ? { ...f, ...changes } : f,
    );
    onUpdate({ ...tab, fields });
  };

  const removeField = (fieldIndex: number) => {
    onUpdate({ ...tab, fields: tab.fields.filter((_, i) => i !== fieldIndex) });
  };

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${tab.label}`}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <Input
          className="h-7 text-[12.5px] tracking-tight bg-transparent border-none px-1 flex-1 focus-visible:ring-1 focus-visible:ring-primary/40 font-medium"
          value={tab.label}
          aria-label="Tab label"
          onChange={(e) => onUpdate({ ...tab, label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />

        <span className="font-mono text-[10px] font-semibold tabular-nums text-muted-foreground/70 px-1">
          {tab.fields.length} {tab.fields.length === 1 ? "field" : "fields"}
        </span>

        {!isFirst && (
          <button
            type="button"
            aria-label="Move tab up"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={onMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            aria-label="Move tab down"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={onMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        )}

        <button
          type="button"
          aria-label={`Remove ${tab.label}`}
          className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Tab fields */}
      {expanded && (
        <div className="p-2 space-y-1.5">
          {tab.fields.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
                Empty Tab
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Add fields with the button below.
              </p>
            </div>
          )}
          {tab.fields.map((field, fi) => (
            <TabFieldEditor
              key={field.id}
              field={field}
              onUpdate={(changes) => updateField(fi, changes)}
              onRemove={() => removeField(fi)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-7 text-[11px] tracking-tight border-dashed focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={addField}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

export function TabsEditor({ tabs, onChange }: TabsEditorProps) {
  const addTab = () => {
    const idx = tabs.length + 1;
    const key = `tab${Date.now().toString(36)}`;
    onChange([...tabs, { key, label: `Tab ${idx}`, fields: [] }]);
  };

  const updateTab = (index: number, updated: TabDefinition) => {
    onChange(tabs.map((t, i) => (i === index ? updated : t)));
  };

  const removeTab = (index: number) => {
    onChange(tabs.filter((_, i) => i !== index));
  };

  const moveTab = (from: number, to: number) => {
    const arr = [...tabs];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
  };

  return (
    <div className="space-y-2">
      {tabs.map((tab, i) => (
        <SingleTabEditor
          key={tab.key}
          tab={tab}
          index={i}
          onUpdate={(updated) => updateTab(i, updated)}
          onRemove={() => removeTab(i)}
          onMoveUp={() => moveTab(i, i - 1)}
          onMoveDown={() => moveTab(i, i + 1)}
          isFirst={i === 0}
          isLast={i === tabs.length - 1}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-8 text-[12px] tracking-tight border-dashed focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={addTab}
      >
        <Plus className="h-3 w-3 mr-1" /> Add Tab
      </Button>
    </div>
  );
}
