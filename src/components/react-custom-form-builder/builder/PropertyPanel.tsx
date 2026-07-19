import { useState, useMemo } from "react";
import { useBuilder } from "./FormBuilderProvider";
import { getField, collectAllFieldNames, collectAllFieldMeta } from "../registry";
import type { FieldOption, FieldSchema, ValidationRule } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Plus, Trash2, ClipboardPaste,
  Tag, Hash, Type, MessageSquare, CircleHelp, Info, Lock, ShieldCheck, FileText, Webhook, Database,
} from "lucide-react";
import { TabsEditor } from "./TabsEditor";
import { HookButton } from "./HookEditor";

function getNestedValue(obj: any, key: string): unknown {
  const parts = key.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Section Header ────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon: typeof Tag; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 pt-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{children}</p>
    </div>
  );
}

// ── Options Editor ────────────────────────────────────────────

function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: (o: FieldOption[]) => void }) {
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addOption = () => onChange([...options, { label: `Option ${options.length + 1}`, value: `option${options.length + 1}` }]);
  const removeOption = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, field: "label" | "value", val: string) => onChange(options.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

  const applyBulk = () => {
    const newOpts = bulkText.split("\n").map(l => l.trim()).filter(Boolean).map(l => ({ label: l, value: slugify(l) }));
    onChange([...options, ...newOpts]);
    setBulkText("");
    setBulkMode(false);
  };

  if (bulkMode) {
    return (
      <div className="space-y-1.5">
        <Textarea
          className="text-[12px] min-h-[72px] resize-y"
          placeholder={"One option per line\ne.g.\nUnited States\nCanada"}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
        />
        <div className="flex gap-1">
          <Button type="button" size="sm" className="h-8 text-[12px] tracking-tight flex-1 focus-visible:ring-2 focus-visible:ring-primary/40" onClick={applyBulk}>
            Add Lines
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-[12px] tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => setBulkMode(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => (
        <div key={i} className="flex gap-1 items-center">
          <Input
            className="h-8 text-[12px]"
            value={opt.label}
            aria-label={`Option ${i + 1} label`}
            onChange={e => updateOption(i, "label", e.target.value)}
            placeholder="Label"
          />
          <Input
            className="h-8 text-[12px] font-mono tabular-nums"
            value={opt.value}
            aria-label={`Option ${i + 1} value`}
            onChange={e => updateOption(i, "value", e.target.value)}
            placeholder="value"
          />
          <button
            type="button"
            aria-label={`Remove ${opt.label || `option ${i + 1}`}`}
            className="shrink-0 p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            onClick={() => removeOption(i)}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-[12px] tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40" onClick={addOption}>
          <Plus className="h-3 w-3 mr-1" />Add
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Bulk paste options"
          className="h-8 text-[12px] focus-visible:ring-2 focus-visible:ring-primary/40"
          title="Bulk paste"
          onClick={() => setBulkMode(true)}
        >
          <ClipboardPaste className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ── Validation Editor ─────────────────────────────────────────

const VALIDATION_TYPES = [
  { value: "required", label: "Required", icon: "!" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "numeric", label: "Numeric only" },
  { value: "alphanumeric", label: "Alphanumeric" },
  { value: "minLength", label: "Min length", hasValue: true },
  { value: "maxLength", label: "Max length", hasValue: true },
  { value: "min", label: "Min value", hasValue: true },
  { value: "max", label: "Max value", hasValue: true },
  { value: "pattern", label: "Regex", hasValue: true },
  { value: "fileMaxSize", label: "Max file size (MB)", hasValue: true },
  { value: "fileTypes", label: "Allowed file types", hasValue: true },
  { value: "fileMinCount", label: "Min file count", hasValue: true },
  { value: "fileMaxCount", label: "Max file count", hasValue: true },
] as const;

function ValidationEditor({ rules, onChange, fieldType }: { rules: ValidationRule[]; onChange: (r: ValidationRule[]) => void; fieldType?: string }) {
  const addRule = () => onChange([...rules, { type: "required", message: "This field is required" }]);
  const removeRule = (i: number) => onChange(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, changes: Partial<ValidationRule>) => onChange(rules.map((r, idx) => idx === i ? { ...r, ...changes } : r));

  const isFileField = fieldType === "file";
  const filteredTypes = VALIDATION_TYPES.filter(t => {
    if (t.value.startsWith("file") && !isFileField) return false;
    if (!t.value.startsWith("file") && isFileField && !["required"].includes(t.value)) return false;
    return true;
  });

  const needsValue = (type: string) => VALIDATION_TYPES.find(t => t.value === type && "hasValue" in t && t.hasValue);

  return (
    <div className="space-y-3 divide-y divide-border/40">
      {rules.map((rule, i) => (
        <div key={i} className="space-y-1.5 pt-2 first:pt-0">
          <div className="flex items-center gap-1">
            <Select value={rule.type} onValueChange={v => updateRule(i, { type: v as ValidationRule["type"] })}>
              <SelectTrigger className="h-8 text-[12px] flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {filteredTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              type="button"
              aria-label="Remove rule"
              className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              onClick={() => removeRule(i)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          {needsValue(rule.type) && (
            <Input
              className="h-8 text-[12px] font-mono tabular-nums"
              placeholder={rule.type === "pattern" ? "^[a-zA-Z]+$" : rule.type === "fileTypes" ? ".pdf,.jpg,.png" : "Value"}
              value={(rule.value as string) ?? ""}
              onChange={e => updateRule(i, { value: rule.type === "pattern" || rule.type === "fileTypes" ? e.target.value : Number(e.target.value) || e.target.value })}
            />
          )}
          <Input
            className="h-8 text-[12px] text-muted-foreground"
            placeholder="Error message"
            value={rule.message}
            onChange={e => updateRule(i, { message: e.target.value })}
          />
        </div>
      ))}
      <div className={rules.length > 0 ? "pt-3" : ""}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-[12px] tracking-tight border-dashed focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={addRule}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Rule
        </Button>
      </div>
    </div>
  );
}

// ── Property Row ──────────────────────────────────────────────

function PropRow({ icon: Icon, label, children }: { icon?: typeof Tag; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm flex items-center gap-1.5 font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

// ── Meta Editor ───────────────────────────────────────────────


// ── Main Panel ──────────────────────────────────────────────

const DISPLAY_ONLY = new Set(["divider", "heading", "paragraph", "hidden", "section"]);

export function PropertyPanel() {
  const { state, selectedField, dispatch } = useBuilder();
  const [nameManual, setNameManual] = useState(false);

  // Must be before any early return to keep hook count stable
  const allNames = useMemo(
    () => selectedField ? collectAllFieldNames(state.schema.fields, selectedField.id) : new Set<string>(),
    [state.schema.fields, selectedField?.id],
  );
  const allFieldMeta = useMemo(
    () => selectedField ? collectAllFieldMeta(state.schema.fields, selectedField.id) : [],
    [state.schema.fields, selectedField?.id],
  );

  if (!selectedField) {
    return (
      <aside
        aria-label="Property panel"
        className="w-[360px] shrink-0 border-l border-border/60 p-6 flex flex-col items-center justify-center text-center"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">
          No Selection
        </p>
        <p className="text-[13px] text-foreground/70 mt-2 max-w-[28ch] leading-snug">
          Select a field on the canvas to edit its properties.
        </p>
      </aside>
    );
  }

  const def = getField(selectedField.type);
  if (!def) return null;

  const update = (key: string, value: unknown) => {
    if (key.startsWith("props.")) {
      dispatch({
        type: "UPDATE_FIELD",
        fieldId: selectedField.id,
        changes: { props: { ...(selectedField.props ?? {}), [key.slice(6)]: value } },
      });
    } else {
      dispatch({ type: "UPDATE_FIELD", fieldId: selectedField.id, changes: { [key]: value } as Partial<FieldSchema> });
    }
  };

  const handleLabelChange = (label: string) => {
    dispatch({ type: "UPDATE_FIELD", fieldId: selectedField.id, changes: { label } });
  };

  const isDataField = !DISPLAY_ONLY.has(selectedField.type) && selectedField.type !== "tabs";

  const hasNameCollision = allNames.has(selectedField.name);

  return (
    <div className="w-[360px] shrink-0 border-l border-border overflow-y-auto p-4 space-y-3">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <def.icon className="h-4.5 w-4.5 text-primary/70" />
          <span className="text-base font-semibold">{def.label}</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">{selectedField.id}</p>
      </div>

      {/* ── Field-specific properties ──────────────────────── */}
      <SectionLabel icon={Tag}>Field Config</SectionLabel>

      {def.propertyFields.map((pf) => {
        if (pf.condition && !pf.condition(selectedField)) return null;
        const val = getNestedValue(selectedField, pf.key);

        if (pf.key === "label") {
          return (
            <PropRow key={pf.key} icon={Type} label={pf.label}>
              <Input className="h-8 text-sm" value={selectedField.label} onChange={e => handleLabelChange(e.target.value)} />
            </PropRow>
          );
        }

        if (pf.key === "name") {
          return (
            <PropRow key={pf.key} icon={Hash} label={pf.label}>
              <div className="flex gap-1 items-center">
                <Input
                  className={`h-8 text-sm font-mono flex-1 ${hasNameCollision ? "border-destructive bg-destructive/5 text-destructive" : ""}`}
                  value={selectedField.name}
                  onChange={e => { setNameManual(true); update("name", e.target.value); }}
                />
                <button
                  type="button"
                  className={`text-[11px] px-1.5 py-0.5 rounded-sm border ${nameManual ? "border-primary/30 text-primary bg-primary/5" : "border-border text-muted-foreground"}`}
                  onClick={() => setNameManual(!nameManual)}
                  title={nameManual ? "Editing manually" : "Auto-generated from label"}
                >{nameManual ? "M" : "A"}</button>
              </div>
              {hasNameCollision && (
                <p className="text-xs text-destructive font-medium mt-0.5">Duplicate: this name already exists</p>
              )}
            </PropRow>
          );
        }

        if (pf.type === "boolean") {
          return (
            <div key={pf.key} className="flex items-center gap-2 py-0.5">
              <Checkbox id={`p-${pf.key}`} checked={!!val} onCheckedChange={c => update(pf.key, !!c)} />
              <Label htmlFor={`p-${pf.key}`} className="text-xs cursor-pointer">{pf.label}</Label>
            </div>
          );
        }

        if (pf.type === "options-editor") {
          return <div key={pf.key}><PropRow label={pf.label}><OptionsEditor options={selectedField.options ?? []} onChange={o => update("options", o)} /></PropRow></div>;
        }

        if (pf.type === "tabs-editor") {
          return <div key={pf.key}><PropRow label={pf.label}><TabsEditor tabs={selectedField.tabs ?? []} onChange={t => update("tabs", t)} /></PropRow></div>;
        }

        if (pf.type === "select" && pf.selectOptions) {
          return (
            <PropRow key={pf.key} label={pf.label}>
              <Select value={(val as string) ?? ""} onValueChange={v => update(pf.key, v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{pf.selectOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </PropRow>
          );
        }

        if (pf.type === "textarea") {
          return <PropRow key={pf.key} label={pf.label}><Textarea className="text-xs min-h-[54px] resize-y" value={(val as string) ?? ""} onChange={e => update(pf.key, e.target.value)} /></PropRow>;
        }

        return (
          <PropRow key={pf.key} label={pf.label}>
            <Input className="h-8 text-sm" type={pf.type === "number" ? "number" : "text"} value={(val as string) ?? ""} onChange={e => update(pf.key, pf.type === "number" ? Number(e.target.value) : e.target.value)} />
          </PropRow>
        );
      })}

      {/* ── Common fields ──────────────────────────────────── */}
      {isDataField && (
        <>
          <Separator className="my-1" />
          <SectionLabel icon={MessageSquare}>Appearance</SectionLabel>

          <PropRow icon={Type} label="Placeholder">
            <Input className="h-8 text-sm" placeholder="Input hint text" value={selectedField.placeholder ?? ""} onChange={e => update("placeholder", e.target.value)} />
          </PropRow>

          <PropRow icon={CircleHelp} label="Help Text">
            <Input className="h-8 text-sm" placeholder="Description below label" value={selectedField.helpText ?? ""} onChange={e => update("helpText", e.target.value)} />
          </PropRow>

          <PropRow icon={Info} label="Tooltip">
            <Input className="h-8 text-sm" placeholder="Hover info popup" value={selectedField.tooltip ?? ""} onChange={e => update("tooltip", e.target.value)} />
          </PropRow>

          <PropRow icon={FileText} label="Default Value">
            <Input className="h-8 text-sm" value={(selectedField.defaultValue as string) ?? ""} onChange={e => update("defaultValue", e.target.value)} />
          </PropRow>

          <Separator className="my-1" />
          <SectionLabel icon={Lock}>Behavior</SectionLabel>

          <div className="space-y-1.5 py-0.5">
            <div className="flex items-center gap-2">
              <Checkbox id="p-req" checked={!!selectedField.required} onCheckedChange={c => update("required", !!c)} />
              <Label htmlFor="p-req" className="text-sm cursor-pointer">Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="p-ro" checked={!!selectedField.readOnly} onCheckedChange={c => update("readOnly", !!c)} />
              <Label htmlFor="p-ro" className="text-sm cursor-pointer">Read Only</Label>
            </div>
          </div>

          <Separator className="my-1" />
          <SectionLabel icon={ShieldCheck}>Validation</SectionLabel>

          <ValidationEditor rules={selectedField.validation ?? []} onChange={r => update("validation", r)} fieldType={selectedField.type} />

          {/* ── Hooks ──────────────────────────────────────── */}
          {selectedField.type !== "file" && (
            <>
              <Separator className="my-1" />
              <SectionLabel icon={Webhook}>Hooks</SectionLabel>
              {state.navPath.some((seg) => {
                const find = (fields: typeof state.schema.fields): boolean =>
                  fields.some((ff) => ff.id === seg.fieldId ? ff.type === "array" : (ff.children && find(ff.children)) || (ff.tabs?.some((t) => find(t.fields)) ?? false));
                return find(state.schema.fields);
              }) && (
                <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5">
                  This field is inside an array. Per-field hooks won't run per-row — use global hooks (beforeSubmit/beforePreload) for per-row transforms.
                </p>
              )}
              <div className="space-y-1.5">
                <HookButton
                  hookType="beforePreload"
                  code={selectedField.hooks?.beforePreload}
                  field={selectedField}
                  allFieldNames={allFieldMeta}
                  onSave={(code) => update("hooks", { ...(selectedField.hooks ?? {}), beforePreload: code })}
                  onClear={() => update("hooks", { ...(selectedField.hooks ?? {}), beforePreload: undefined })}
                />
                <HookButton
                  hookType="beforeSubmit"
                  code={selectedField.hooks?.beforeSubmit}
                  field={selectedField}
                  allFieldNames={allFieldMeta}
                  onSave={(code) => update("hooks", { ...(selectedField.hooks ?? {}), beforeSubmit: code })}
                  onClear={() => update("hooks", { ...(selectedField.hooks ?? {}), beforeSubmit: undefined })}
                />
                <HookButton
                  hookType="validate"
                  code={selectedField.hooks?.validate}
                  field={selectedField}
                  allFieldNames={allFieldMeta}
                  onSave={(code) => update("hooks", { ...(selectedField.hooks ?? {}), validate: code })}
                  onClear={() => update("hooks", { ...(selectedField.hooks ?? {}), validate: undefined })}
                />
                <HookButton
                  hookType="sideEffect"
                  code={selectedField.hooks?.sideEffect}
                  field={selectedField}
                  allFieldNames={allFieldMeta}
                  onSave={(code) => update("hooks", { ...(selectedField.hooks ?? {}), sideEffect: code })}
                  onClear={() => update("hooks", { ...(selectedField.hooks ?? {}), sideEffect: undefined })}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
