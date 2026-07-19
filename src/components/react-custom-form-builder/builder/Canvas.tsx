import { useState } from "react";
import { createPortal } from "react-dom";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useBuilder } from "./FormBuilderProvider";
import { CanvasField } from "./CanvasField";
import { HookButton } from "./HookEditor";
import { ChevronRight, Home, Webhook } from "lucide-react";

// Dummy field for global hooks — never rendered, just used as HookButton prop
const GLOBAL_DUMMY = { id: "_global", name: "_global", type: "input" as const, label: "Global" };

const LIFECYCLE_TEXT = `1. Per-field beforePreload
2. Global beforePreload
3. Per-field sideEffect (hide/disable)
4. User fills form
5. Per-field validation + custom validate
6. Global validate
7. Flatten containers
8. Remove hidden/disabled keys
9. Per-field beforeSubmit
10. Global beforeSubmit
11. onSubmit()`;

function LifecycleTooltip() {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: rect.left, y: rect.top - 4 });
    setShow(true);
  };

  return (
    <>
      <span
        className="text-muted-foreground/50 cursor-help ml-1"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      >
        <span className="text-[10px]">Lifecycle ⓘ</span>
      </span>
      {show &&
        createPortal(
          <div
            style={{ left: pos.x, top: pos.y, transform: "translateY(-100%)" }}
            className="fixed px-3 py-2 text-[10px] leading-relaxed bg-popover text-popover-foreground border border-border rounded-md shadow-lg w-[260px] z-[9999] pointer-events-none whitespace-pre-line"
          >
            {LIFECYCLE_TEXT}
          </div>,
          document.body,
        )}
    </>
  );
}

export function Canvas() {
  const { state, dispatch, currentFields } = useBuilder();
  const { navPath } = state;
  const gh = state.schema.globalHooks ?? {};

  const { setNodeRef, isOver } = useDroppable({ id: "canvas-droppable" });

  const updateGlobalHook = (key: string, code: string | undefined) => {
    dispatch({
      type: "UPDATE_SCHEMA",
      changes: { globalHooks: { ...gh, [key]: code } },
    });
  };

  return (
    <div
      className="flex-1 min-w-0 overflow-y-auto p-4 bg-muted/30"
      onClick={() => dispatch({ type: "SELECT_FIELD", fieldId: null })}
    >
      {/* Global hooks bar — root level only */}
      {navPath.length === 0 && (
        <div className="mb-3 pb-3 border-b border-border/60" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2">
            <Webhook className="h-3 w-3 text-muted-foreground/70" aria-hidden />
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/90">Global Hooks</span>
            <LifecycleTooltip />
          </div>
          <div className="flex gap-2">
            <HookButton
              hookType="beforePreload"
              code={gh.beforePreload}
              field={GLOBAL_DUMMY}
              onSave={(code) => updateGlobalHook("beforePreload", code)}
              onClear={() => updateGlobalHook("beforePreload", undefined)}
            />
            <HookButton
              hookType="validate"
              code={gh.validate}
              field={GLOBAL_DUMMY}
              onSave={(code) => updateGlobalHook("validate", code)}
              onClear={() => updateGlobalHook("validate", undefined)}
            />
            <HookButton
              hookType="beforeSubmit"
              code={gh.beforeSubmit}
              field={GLOBAL_DUMMY}
              onSave={(code) => updateGlobalHook("beforeSubmit", code)}
              onClear={() => updateGlobalHook("beforeSubmit", undefined)}
            />
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      {navPath.length > 0 && (
        <nav aria-label="Form section breadcrumb" className="flex items-center gap-1 mb-3 text-[12px] tracking-tight">
          <button
            type="button"
            aria-label="Return to form root"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-[background-color,color] duration-150 px-1.5 py-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: "NAVIGATE_TO", depth: 0 }); }}
          >
            <Home className="h-3 w-3" />
            <span>Root</span>
          </button>
          {navPath.map((seg, i) => (
            <div key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" aria-hidden />
              <button
                type="button"
                aria-current={i === navPath.length - 1 ? "page" : undefined}
                className={`px-1.5 py-0.5 rounded transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  i === navPath.length - 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (i < navPath.length - 1) dispatch({ type: "NAVIGATE_TO", depth: i + 1 });
                }}
              >
                {seg.label}
              </button>
            </div>
          ))}
        </nav>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`min-h-[400px] rounded-xl border-2 border-dashed transition-[border-color,background-color] duration-150 motion-reduce:transition-none p-3 space-y-2 ${
          isOver
            ? "border-primary/60 bg-primary/[0.04]"
            : currentFields.length === 0
              ? "border-border/50"
              : "border-transparent"
        }`}
      >
        {currentFields.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center h-[300px] px-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
              Empty Canvas
            </p>
            <p className="text-[13px] text-foreground/70 mt-2 max-w-[36ch]">
              {navPath.length > 0
                ? "Drag fields from the palette into this container."
                : "Drag fields from the palette to start building your form."}
            </p>
          </div>
        )}

        <SortableContext
          items={currentFields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {currentFields.map((field, i) => (
            <CanvasField key={field.id} field={field} index={i} total={currentFields.length} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
