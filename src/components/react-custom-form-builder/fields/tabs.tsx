import { Columns, List, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { registerField, getField } from "../registry";
import type { FieldDefinition, CanvasFieldProps, RuntimeFieldProps } from "../types";
import { NestedFieldRenderer } from "../renderer/NestedFieldRenderer";

const CanvasComponent = ({ field }: CanvasFieldProps) => {
  const tabs = field.tabs ?? [];
  const total = tabs.reduce((s, t) => s + t.fields.length, 0);
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{field.label}</span>
      <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
        <div className="flex flex-wrap gap-1 p-1">
          {tabs.length === 0 && (
            <span className="px-2 py-1 text-[11px] text-muted-foreground">No tabs configured</span>
          )}
          {tabs.map((tab, i) => (
            <div
              key={tab.key}
              data-tab-navigate={tab.key}
              className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] cursor-pointer pointer-events-auto transition-colors ${
                i === 0
                  ? "bg-background text-foreground ring-1 ring-border font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-muted-foreground/60">({tab.fields.length})</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          {total} field{total !== 1 ? "s" : ""} across {tabs.length} tab{tabs.length !== 1 ? "s" : ""}
          <span className="ml-1 text-muted-foreground/50">— click a tab to enter</span>
        </div>
      </div>
    </div>
  );
};

const RuntimeComponent = ({ field, value, onChange, allErrors, sideEffects, widgetDataFactory }: RuntimeFieldProps) => {
  const tabs = field.tabs ?? [];
  const state = (value as { activeTab: string; data: Record<string, unknown> }) ?? {
    activeTab: tabs[0]?.key ?? "",
    data: {},
  };
  const activeTab = state.activeTab || tabs[0]?.key || "";
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const setActiveTab = (key: string) => onChange({ ...state, activeTab: key });
  const setFieldValue = (name: string, val: unknown) =>
    onChange({ ...state, data: { ...state.data, [name]: val } });

  const currentIndex = Math.max(0, tabs.findIndex((t) => t.key === activeTab));

  const tabHasError = (tab: typeof tabs[0]) =>
    tab.fields.some((f) => allErrors?.[f.name]);

  // Close the mobile menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!tabs.length) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex + 1) % tabs.length].key);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length].key);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab(tabs[0].key);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1].key);
    }
  };

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeTab));

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
      <div className="relative flex items-center border-b border-border/60">
        {/* Mobile tab menu button */}
        <div ref={menuRef} className="sm:hidden shrink-0 pl-1.5">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Show all tabs"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <List className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute left-1.5 top-full mt-2 z-30 min-w-[14rem] max-h-72 overflow-y-auto [overscroll-behavior:contain] rounded-xl border border-border/50 bg-gradient-to-b from-popover to-popover/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-xl py-1.5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200 motion-reduce:animate-none"
            >
              <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-2 border-b border-border/40">
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                  Tabs
                </span>
                <span className="font-mono ml-auto text-[10px] font-semibold tabular-nums text-muted-foreground/60">
                  {tabs.length.toString().padStart(2, "0")}
                </span>
              </div>
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                const hasError = tabHasError(tab);
                return (
                  <button
                    key={tab.key}
                    role="menuitem"
                    type="button"
                    onClick={() => { setActiveTab(tab.key); setMenuOpen(false); }}
                    aria-current={isActive ? "page" : undefined}
                    className={`group/item relative w-full flex items-center gap-2 pl-3 pr-3 py-2 text-[13px] tracking-tight text-left transition-[background-color,color] duration-150 focus:outline-none focus-visible:bg-primary/10 focus-visible:text-primary ${
                      isActive
                        ? "text-primary font-semibold"
                        : "text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r transition-colors ${
                        isActive
                          ? "bg-primary"
                          : "bg-transparent group-hover/item:bg-primary/30"
                      }`}
                    />
                    <span className="flex-1 truncate">{tab.label}</span>
                    {hasError && (
                      <span
                        aria-label="has errors"
                        className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none"
                      />
                    )}
                    {isActive && (
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="flex-1 flex flex-wrap"
        >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const hasError = tabHasError(tab);
          return (
            <button
              key={tab.key}
              data-tab-key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-[13px] tracking-tight transition-[color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset ${
                isActive
                  ? "text-foreground font-semibold shadow-[inset_0_-2px_0_0_hsl(var(--primary))]"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {hasError && !isActive && (
                  <span
                    aria-label="has errors"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none"
                  />
                )}
              </span>
            </button>
          );
        })}
        </div>

        {/* Position indicator on the right */}
        {tabs.length > 0 && (
          <div className="hidden sm:flex shrink-0 items-center gap-1 px-3 border-l border-border/60 self-stretch">
            <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
              {(activeIndex + 1).toString().padStart(2, "0")}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/50">/</span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
              {tabs.length.toString().padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
      {tabs.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">
            No Tabs
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            This field has no tabs configured.
          </p>
        </div>
      ) : (
        // Render every tab's fields up front; hide inactive ones via the
        // `hidden` attribute so their state + data fetches survive tab
        // switches (no remount → no refetch).
        tabs.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            id={`tabpanel-${tab.key}`}
            aria-labelledby={`tab-${tab.key}`}
            className="p-4"
            hidden={tab.key !== activeTab}
          >
            <NestedFieldRenderer
              fields={tab.fields}
              values={state.data}
              onChange={setFieldValue}
              errors={allErrors}
              sideEffects={sideEffects}
              onWidgetDataChange={widgetDataFactory}
            />
          </div>
        ))
      )}
    </div>
  );
};

const def: FieldDefinition = {
  type: "tabs",
  label: "Tabs",
  icon: Columns,
  category: "layout",
  defaultSchema: {
    tabs: [
      { key: "tab1", label: "Tab 1", fields: [] },
      { key: "tab2", label: "Tab 2", fields: [] },
    ],
  },
  CanvasComponent,
  RuntimeComponent,
  propertyFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "name", label: "Field Name", type: "text" },
    { key: "props.segregateByTab", label: "Segregate response by active tab", type: "boolean" },
    { key: "tabs", label: "Tabs Configuration", type: "tabs-editor" },
  ],
};

registerField(def);
