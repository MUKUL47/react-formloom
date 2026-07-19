import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getFieldsByCategory } from "../registry";
import type { FieldDefinition, FieldType } from "../types";
import { useBuilder } from "./FormBuilderProvider";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

/** Container types that cannot be nested inside an array */
const CONTAINER_TYPES = new Set<string>(["section", "array", "tabs"]);

// Ensure all fields are registered
import "../fields";

const CATEGORY_LABELS: Record<string, string> = {
  input: "Input Fields",
  selection: "Selection Fields",
  layout: "Layout & Structure",
  display: "Display",
  widget: "Widgets",
};

const CATEGORY_ORDER = ["input", "selection", "layout", "display", "widget"];

function PaletteItem({ def, onAdd }: { def: FieldDefinition; onAdd?: (type: FieldType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.type}`,
    data: { type: "palette-item", fieldType: def.type as FieldType },
  });

  const Icon = def.icon;

  return (
    <div
      className={`group/palette flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-[12.5px] tracking-tight transition-[border-color,opacity,box-shadow] duration-150 motion-reduce:transition-none hover:border-border hover:shadow-sm ${isDragging ? "opacity-50" : ""}`}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={`Drag ${def.label} field`}
        className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{def.label}</span>
      </div>
      <button
        type="button"
        onClick={() => onAdd?.(def.type as FieldType)}
        aria-label={`Add ${def.label} field`}
        className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        title={`Add ${def.label}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export function Palette({ onAdd }: { onAdd?: (type: FieldType) => void }) {
  const { state } = useBuilder();
  const grouped = getFieldsByCategory();
  const [search, setSearch] = useState("");

  // When inside an array, hide container types (flat inputs only)
  const insideArray = state.navPath.some((seg) => {
    const find = (fields: typeof state.schema.fields): boolean =>
      fields.some((ff) => ff.id === seg.fieldId ? ff.type === "array" : (ff.children && find(ff.children)) || (ff.tabs?.some((t) => find(t.fields)) ?? false));
    return find(state.schema.fields);
  });

  const filterText = search.toLowerCase().trim();

  return (
    <div className="w-52 shrink-0 border-r border-border/60 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-border/60 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
          <Input
            className="h-8 text-[12.5px] tracking-tight pl-8"
            placeholder="Search fields…"
            aria-label="Search palette fields"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="p-2 space-y-4 flex-1 overflow-y-auto [overscroll-behavior:contain]">
        {CATEGORY_ORDER.map((category) => {
          const fields = grouped[category];
          if (!fields) return null;

          let filtered = insideArray
            ? fields.filter((d) => !CONTAINER_TYPES.has(d.type))
            : fields;

          filtered = filterText
            ? filtered.filter((d) => d.label.toLowerCase().includes(filterText) || d.type.toLowerCase().includes(filterText))
            : filtered;

          if (filtered.length === 0) return null;

          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <h4 className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-[0.22em]">
                  {CATEGORY_LABELS[category] ?? category}
                </h4>
                <span className="h-px flex-1 bg-border/50" />
                <span className="font-mono text-[9px] font-semibold tabular-nums text-muted-foreground/60">
                  {filtered.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-0.5">
                {filtered.map((def) => (
                  <PaletteItem key={def.type} def={def} onAdd={onAdd} />
                ))}
              </div>
            </div>
          );
        })}

        {filterText && CATEGORY_ORDER.every((cat) => {
          const f = grouped[cat];
          return !f || f.filter((d) => d.label.toLowerCase().includes(filterText) || d.type.toLowerCase().includes(filterText)).length === 0;
        }) && (
          <div className="py-8 px-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">
              No Matches
            </p>
            <p className="text-[12px] text-foreground/70 mt-1.5">
              Nothing for &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
