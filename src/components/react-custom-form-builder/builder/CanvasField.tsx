import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Asterisk, Copy, ChevronUp, ChevronDown, FolderInput } from "lucide-react";
import { getField } from "../registry";
import type { FieldSchema } from "../types";
import { useBuilder } from "./FormBuilderProvider";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

/** Recursively collect all container targets (tabs/sections) for "move into" */
function collectContainerTargets(
  fields: FieldSchema[],
  excludeId: string,
  path: string[] = [],
): { label: string; fieldId: string; tabKey?: string }[] {
  const targets: { label: string; fieldId: string; tabKey?: string }[] = [];
  for (const f of fields) {
    if (f.id === excludeId) continue;
    if (f.type === "section" || f.type === "columns" || f.type === "array") {
      const p = [...path, f.label || f.type];
      targets.push({ label: p.join(" / "), fieldId: f.id });
      if (f.children) targets.push(...collectContainerTargets(f.children, excludeId, p));
    }
    if (f.type === "tabs" && f.tabs) {
      for (const tab of f.tabs) {
        const p = [...path, f.label || "Tabs", tab.label];
        targets.push({ label: p.join(" / "), fieldId: f.id, tabKey: tab.key });
        targets.push(...collectContainerTargets(tab.fields, excludeId, p));
      }
    }
  }
  return targets;
}

export function CanvasField({ field, index, total }: { field: FieldSchema; index: number; total: number }) {
  const { state, dispatch } = useBuilder();
  const isSelected = state.selectedFieldId === field.id;
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const def = getField(field.type);
  if (!def) return null;

  const { CanvasComponent } = def;

  const isTabsContainer = field.type === "tabs" && field.tabs && field.tabs.length > 0;
  const isSectionContainer = field.type === "section";

  const containerTargets = collectContainerTargets(state.schema.fields, field.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-card p-3 transition-[border-color,box-shadow,opacity,transform] duration-150 motion-reduce:transition-none ${
        isDragging ? "opacity-30 scale-95" : ""
      } ${
        isOver && !isDragging
          ? "border-primary border-t-2 shadow-[0_-2px_8px_-2px_hsl(var(--primary)/0.3)]"
          : ""
      } ${
        isSelected
          ? "border-primary/50 shadow-[inset_3px_0_0_0_hsl(var(--primary)),0_2px_8px_-4px_hsl(var(--primary)/0.25)]"
          : "border-border hover:border-border hover:shadow-sm"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        // Check if a tab label was clicked — navigate into it directly
        const tabKey = (e.target as HTMLElement).closest?.("[data-tab-navigate]")?.getAttribute("data-tab-navigate");
        if (tabKey && field.tabs) {
          const tab = field.tabs.find((t) => t.key === tabKey);
          if (tab) {
            dispatch({ type: "NAVIGATE_INTO", fieldId: field.id, tabKey, label: `${field.label} / ${tab.label}` });
            return;
          }
        }
        // Check if section/columns header was clicked — navigate into it
        if ((e.target as HTMLElement).closest?.("[data-section-navigate]") && (field.type === "section" || field.type === "columns" || field.type === "array")) {
          dispatch({ type: "NAVIGATE_INTO", fieldId: field.id, label: field.label || field.type });
          return;
        }
        dispatch({ type: "SELECT_FIELD", fieldId: field.id });
      }}
    >
      {/* Left: Drag handle + up/down arrows */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 motion-reduce:transition-none">
        <button
          type="button"
          aria-label="Move field up"
          className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-[background-color,color] duration-150 disabled:opacity-20 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: "MOVE_FIELD", activeId: field.id, overIndex: index - 1 }); }}
          title="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-[background-color] duration-150"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
        <button
          type="button"
          aria-label="Move field down"
          className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-[background-color,color] duration-150 disabled:opacity-20 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={index === total - 1}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: "MOVE_FIELD", activeId: field.id, overIndex: index + 1 }); }}
          title="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Top-right controls */}
      <div className="absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 motion-reduce:transition-none">
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono font-normal tracking-tight">
          {field.type}
        </Badge>
        {field.required && (
          <span className="text-rose-500" title="Required" aria-label="Required field">
            <Asterisk className="h-3 w-3" />
          </span>
        )}
        {/* Move to container */}
        {containerTargets.length > 0 && (
          <div className="relative">
            <button
              type="button"
              aria-label="Move into section or tab"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title="Move into section/tab"
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu((p) => !p); }}
            >
              <FolderInput className="h-3.5 w-3.5" />
            </button>
            {showMoveMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-border/50 bg-popover shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.04)] overflow-hidden min-w-[220px] max-h-48 overflow-y-auto [overscroll-behavior:contain]" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-[12px] tracking-tight text-popover-foreground hover:bg-primary/[0.06] hover:text-primary transition-[background-color,color] duration-150 border-b border-border/40 focus:outline-none focus-visible:bg-primary/10 focus-visible:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "MOVE_TO_ROOT", fieldId: field.id });
                    setShowMoveMenu(false);
                  }}
                >
                  Root level
                </button>
                {containerTargets.map((target) => (
                  <button
                    key={`${target.fieldId}-${target.tabKey ?? ""}`}
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-[12px] tracking-tight text-popover-foreground hover:bg-primary/[0.06] hover:text-primary transition-[background-color,color] duration-150 focus:outline-none focus-visible:bg-primary/10 focus-visible:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "MOVE_TO_CONTAINER", fieldId: field.id, targetFieldId: target.fieldId, targetTabKey: target.tabKey });
                      setShowMoveMenu(false);
                    }}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          aria-label="Duplicate field"
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          title="Duplicate"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: "DUPLICATE_FIELD", fieldId: field.id }); }}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete field"
          className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: "REMOVE_FIELD", fieldId: field.id }); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Field preview */}
      <div className="pl-6 pr-20 pointer-events-none">
        <CanvasComponent field={field} selected={isSelected} />
      </div>

      {/* Tabs: clickable tab labels in preview handle navigation */}

      {/* Section: clickable header in preview handles navigation */}

      {/* Bottom info bar */}
      {isSelected && !isTabsContainer && !isSectionContainer && (
        <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2.5 text-[11px]">
          <span className="font-mono tabular-nums text-muted-foreground">{field.name}</span>
          {field.required && (
            <span className="font-semibold uppercase tracking-[0.18em] text-[9px] text-rose-600/80">
              Required
            </span>
          )}
          {field.placeholder && (
            <span className="text-muted-foreground/60 truncate italic" title={field.placeholder}>
              &ldquo;{field.placeholder}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
