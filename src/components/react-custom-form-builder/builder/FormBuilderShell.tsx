import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useBuilder } from "./FormBuilderProvider";
import { Palette } from "./Palette";
import { Canvas } from "./Canvas";
import { PropertyPanel } from "./PropertyPanel";
import { BuilderToolbar } from "./BuilderToolbar";
import { createFieldSchema, getField } from "../registry";
import type { FieldType, FormSchema } from "../types";
import type { BuilderTheme } from "../ReactCustomFormBuilder";

interface FormBuilderShellProps {
  onSave?: (schema: FormSchema) => void;
  saving?: boolean;
  extraActions?: React.ReactNode;
  theme?: BuilderTheme;
  onThemeChange?: (theme: BuilderTheme) => void;
}

export function FormBuilderShell({ onSave, saving, extraActions, theme = "system", onThemeChange }: FormBuilderShellProps) {
  const { state, dispatch, currentFields, canUndo, canRedo } = useBuilder();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ── Keyboard shortcuts ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) dispatch({ type: "UNDO" });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) dispatch({ type: "REDO" });
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedFieldId) {
          e.preventDefault();
          dispatch({ type: "REMOVE_FIELD", fieldId: state.selectedFieldId });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        if (state.selectedFieldId) {
          e.preventDefault();
          dispatch({ type: "DUPLICATE_FIELD", fieldId: state.selectedFieldId });
        }
      }
      if (e.key === "Escape") {
        if (state.navPath.length > 0) {
          dispatch({ type: "NAVIGATE_TO", depth: state.navPath.length - 1 });
        } else {
          dispatch({ type: "SELECT_FIELD", fieldId: null });
        }
      }
    },
    [canUndo, canRedo, state.selectedFieldId, state.navPath, dispatch],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Unsaved changes warning ─────────────────────────────────
  useEffect(() => {
    const isDirty = state.historyIndex > 0;
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.historyIndex]);

  // ── Drag handlers ───────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // Palette → drop into canvas only
    if (activeData?.type === "palette-item") {
      const overIndex = currentFields.findIndex((f) => f.id === over.id);
      const isCanvasZone = over.id === "canvas-droppable";
      if (overIndex < 0 && !isCanvasZone) return; // dropped outside canvas — ignore

      const fieldType = activeData.fieldType as FieldType;
      const newField = createFieldSchema(fieldType);
      if (!newField) return;

      const insertAt = overIndex >= 0 ? overIndex + 1 : currentFields.length;
      dispatch({ type: "ADD_FIELD", field: newField, index: insertAt });
      return;
    }

    // Reorder within current level
    if (active.id !== over.id) {
      const oldIndex = currentFields.findIndex((f) => f.id === active.id);
      const newIndex = currentFields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({ type: "MOVE_FIELD", activeId: active.id as string, overIndex: newIndex });
      }
    }
  };

  // Resolve "system" theme to actual preference
  const resolvedDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background text-foreground ${resolvedDark ? "dark" : ""}`}>
        <BuilderToolbar onSave={onSave} saving={saving} extraActions={extraActions} theme={theme} onThemeChange={onThemeChange} />
        <div className="flex flex-1 overflow-hidden">
          <Palette onAdd={(fieldType) => {
            const newField = createFieldSchema(fieldType);
            if (newField) dispatch({ type: "ADD_FIELD", field: newField, index: currentFields.length });
          }} />
          <Canvas />
          <PropertyPanel />
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }} modifiers={[snapCenterToCursor]} style={{ cursor: "grabbing" }}>
        {activeId ? (() => {
          // Palette drag
          if (typeof activeId === "string" && activeId.startsWith("palette-")) {
            const type = activeId.replace("palette-", "");
            const def = getField(type as FieldType);
            if (def) {
              const Icon = def.icon;
              return (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-card px-3 py-2 text-sm shadow-xl ring-2 ring-primary/20 pointer-events-none w-fit">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{def.label}</span>
                </div>
              );
            }
          }
          // Canvas field drag
          const field = currentFields.find((f) => f.id === activeId);
          if (field) {
            const def = getField(field.type);
            const Icon = def?.icon;
            return (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-card px-3 py-2 text-sm shadow-xl ring-2 ring-primary/20 pointer-events-none w-fit">
                {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
                <span className="font-medium tracking-tight">{field.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{field.name}</span>
              </div>
            );
          }
          return null;
        })() : null}
      </DragOverlay>
    </DndContext>
  );
}
