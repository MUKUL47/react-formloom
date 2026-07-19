import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play } from "lucide-react";
import { getField } from "../registry";
import type { FieldSchema } from "../types";

import "../fields";

const PRELOAD_TEMPLATE = `/**
 * beforePreload hook
 *
 * Runs when data from the server is loaded into the form.
 * Transform the raw value before it's displayed.
 *
 * @param {*} value       - The raw value from server for this field
 * @param {string} fieldName  - The field's name/key
 * @param {object} allValues  - All field values being loaded
 * @returns {*} The transformed value to display in the form
 */
function beforePreload(value, fieldName, allValues) {
  try {
    // Example: parse a date string
    // if (typeof value === 'string') return value.split('T')[0];

    return value;
  } catch {
    return value;
  }
}`;

const SUBMIT_TEMPLATE = `/**
 * beforeSubmit hook
 *
 * Runs before form submission.
 * Transform the field's value before it's sent.
 * Only the VALUE is modified — the key stays the same.
 *
 * @param {*} value       - The current value of this field
 * @param {string} fieldName  - The field's name/key
 * @param {object} allValues  - All form values being submitted
 * @returns {*} The transformed value to submit
 */
function beforeSubmit(value, fieldName, allValues) {
  try {
    // Example: combine date range into a string
    // if (value && value.start && value.end) return value.start + ' to ' + value.end;

    return value;
  } catch {
    return value;
  }
}`;

const VALIDATE_TEMPLATE = `/**
 * Custom validation hook
 *
 * Runs during form validation (before submit).
 *
 * @param {*} value       - The current value of this field
 * @param {string} fieldName  - The field's name/key
 * @param {object} allValues  - All form values
 * @returns {true|false|string}
 *   true   → validation passes
 *   false  → shows "Invalid value"
 *   string → shows the string as a custom error message
 */
function validate(value, fieldName, allValues) {
  try {
    // Example: must be at least 3 characters
    // if (typeof value === 'string' && value.length < 3) return 'Must be at least 3 characters';

    return true;
  } catch {
    return true;
  }
}`;

const SIDE_EFFECT_TEMPLATE = `/**
 * Side Effect hook
 *
 * Runs after beforePreload, re-runs on every value change.
 * Return which fields to hide, disable, require, or override.
 * - hide: field removed from DOM + excluded from submission
 * - disable: field grayed out but included in submission
 * - required: dynamically make other fields required
 * - override: set another field's value (e.g. auto-fill, computed)
 * NOTE: You cannot target this field itself in any of the four.
 *
 * @param {*} value       - The current value of this field
 * @param {string} fieldName  - This field's name/key
 * @param {object} allValues  - All form values
 * @returns {{ hide: string[], disable: string[], required: string[], override: object }}
 */
function sideEffect(value, fieldName, allValues) {
  try {
    // Example: hide 'spouse_name' if not married, require 'company' if employed
    // if (value !== 'married') return { hide: ['spouse_name'] };
    // if (value === 'employed') return { required: ['company_name'] };
    // return { override: { country_code: '+1' } };

    return { hide: [], disable: [], required: [], override: {} };
  } catch {
    return { hide: [], disable: [], required: [], override: {} };
  }
}`;

const GLOBAL_PRELOAD_TEMPLATE = `/**
 * Global beforePreload hook
 *
 * Runs AFTER all per-field preload hooks.
 * Receives the entire values object. Must return the transformed object.
 *
 * @param {object} allValues - All field values being loaded
 * @returns {object} The transformed values object
 */
function beforePreload(allValues) {
  try {
    return allValues;
  } catch {
    return allValues;
  }
}`;

const GLOBAL_SUBMIT_TEMPLATE = `/**
 * Global beforeSubmit hook
 *
 * Runs AFTER all per-field submit hooks and flattening.
 * Receives the entire flattened values object. Must return the transformed object.
 *
 * @param {object} allValues - All form values (already flattened)
 * @returns {object} The transformed values object to submit
 */
function beforeSubmit(allValues) {
  try {
    return allValues;
  } catch {
    return allValues;
  }
}`;

const GLOBAL_VALIDATE_TEMPLATE = `/**
 * Global validation hook
 *
 * Runs AFTER all per-field validations pass.
 * Receives the entire values object.
 *
 * @param {object} allValues - All form values
 * @returns {true|false|string}
 *   true   → validation passes
 *   false  → shows "Form validation failed"
 *   string → shows the string as a custom error message
 */
function validate(allValues) {
  try {
    return true;
  } catch {
    return true;
  }
}`;

type HookType = "beforePreload" | "beforeSubmit" | "validate" | "sideEffect";

interface HookEditorProps {
  hookType: HookType;
  code: string;
  onSave: (code: string) => void;
  onClose: () => void;
  field: FieldSchema;
  allFieldNames?: { name: string; label: string }[];
}

function TestInputPanel({
  field,
  testValue,
  onTestValueChange,
  rawJsonStr,
  onRawJsonStrChange,
}: {
  field: FieldSchema;
  testValue: unknown;
  onTestValueChange: (v: unknown) => void;
  rawJsonStr: string;
  onRawJsonStrChange: (s: string) => void;
}) {
  const def = getField(field.type);
  if (!def) return null;

  const { RuntimeComponent } = def;

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Test Input</Label>
        <Badge variant="secondary" className="text-[9px] font-mono">{field.type}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Enter a value below, then click <strong>Test</strong> to run your hook against it.
      </p>
      <div className="bg-background rounded-md border border-border p-2 max-h-32 overflow-y-auto">
        <RuntimeComponent
          field={field}
          value={testValue}
          onChange={onTestValueChange}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Raw JSON value:</Label>
        <Textarea
          className="text-[11px] font-mono min-h-[120px] resize-y bg-background"
          value={rawJsonStr}
          onChange={(e) => {
            onRawJsonStrChange(e.target.value);
            try { onTestValueChange(JSON.parse(e.target.value)); } catch {}
          }}
        />
      </div>
    </div>
  );
}

function HookEditorDialog({ hookType, code, onSave, onClose, field, allFieldNames }: HookEditorProps) {
  const isGlobal = field.id === "_global";

  const getTemplate = () => {
    if (isGlobal) {
      if (hookType === "validate") return GLOBAL_VALIDATE_TEMPLATE;
      if (hookType === "beforePreload") return GLOBAL_PRELOAD_TEMPLATE;
      return GLOBAL_SUBMIT_TEMPLATE;
    }
    if (hookType === "validate") return VALIDATE_TEMPLATE;
    if (hookType === "beforePreload") return PRELOAD_TEMPLATE;
    if (hookType === "sideEffect") return SIDE_EFFECT_TEMPLATE;
    return SUBMIT_TEMPLATE;
  };

  const template = getTemplate();
  const [editorValue, setEditorValue] = useState(code || template);
  const [testValue, setTestValue] = useState<unknown>(isGlobal ? {} : (field.defaultValue ?? ""));
  const initVal = isGlobal ? {} : (field.defaultValue ?? "");
  const [testJsonStr, setTestJsonStr] = useState(JSON.stringify(initVal, null, 2) ?? "");
  const [testResult, setTestResult] = useState<{ ok: boolean; output: string } | null>(null);

  const handleTest = useCallback(() => {
    try {
      const fnName = hookType;
      let result: unknown;

      if (isGlobal) {
        // Global hooks: fn(allValues)
        const fn = new Function(`${editorValue}\nreturn ${fnName}(arguments[0]);`);
        result = fn(testValue);
      } else {
        // Per-field hooks: fn(value, fieldName, allValues)
        const allValues = { [field.name]: testValue };
        const fn = new Function(
          "value", "fieldName", "allValues",
          `${editorValue}\nreturn ${fnName}(value, fieldName, allValues);`,
        );
        result = fn(testValue, field.name, allValues);
      }

      if (hookType === "validate") {
        if (result === true) {
          setTestResult({ ok: true, output: "Validation passed" });
        } else if (result === false) {
          setTestResult({ ok: false, output: isGlobal ? "Form validation failed" : "Invalid value" });
        } else if (typeof result === "string") {
          setTestResult({ ok: false, output: result });
        } else {
          setTestResult({ ok: false, output: `Unexpected return: ${JSON.stringify(result)}` });
        }
      } else if (hookType === "sideEffect") {
        const r = result as any;
        const hide = Array.isArray(r?.hide) ? r.hide : [];
        const disable = Array.isArray(r?.disable) ? r.disable : [];
        const override = (r?.override && typeof r.override === "object" && !Array.isArray(r.override)) ? r.override : {};
        const overrideKeys = Object.keys(override);
        const selfRef = hide.includes(field.name) || disable.includes(field.name) || (field.name in override);
        const lines = [
          `Hide: [${hide.join(", ")}]`,
          `Disable: [${disable.join(", ")}]`,
          overrideKeys.length > 0 ? `Override: ${JSON.stringify(override, null, 2)}` : `Override: {}`,
        ];
        if (selfRef) lines.push("\n⚠ Self-reference removed at runtime");
        setTestResult({ ok: !selfRef, output: lines.join("\n") });
      } else {
        setTestResult({ ok: true, output: JSON.stringify(result, null, 2) });
      }
    } catch (err: any) {
      setTestResult({ ok: false, output: err.message });
    }
  }, [editorValue, hookType, field.name, testValue, isGlobal]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {hookType}
            </Badge>
            <span>Hook for "{field.label}" <span className="text-muted-foreground font-mono font-normal">({field.name})</span></span>
          </DialogTitle>
          <DialogDescription>
            Write a function that receives{" "}
            <code className="text-xs bg-muted px-1 rounded">value</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">fieldName</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">allValues</code>{" "}
            and returns the transformed value. If it throws, the original value is used.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex gap-3">
          {/* Left: Monaco editor */}
          <div className="flex-1 min-w-0 rounded-md border border-border overflow-hidden">
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={editorValue}
              onChange={(v) => setEditorValue(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Right: Test panel */}
          <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
            {isGlobal ? (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <Label className="text-xs font-semibold">Test Input (allValues)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Enter the full form values object as JSON.
                </p>
                <Textarea
                  className="text-[11px] font-mono min-h-[150px] resize-y bg-background"
                  value={testJsonStr}
                  onChange={(e) => {
                    setTestJsonStr(e.target.value);
                    try { setTestValue(JSON.parse(e.target.value)); } catch {}
                  }}
                />
              </div>
            ) : (
              <TestInputPanel
                field={field}
                testValue={testValue}
                onTestValueChange={(v) => { setTestValue(v); setTestJsonStr(JSON.stringify(v, null, 2)); }}
                rawJsonStr={testJsonStr}
                onRawJsonStrChange={setTestJsonStr}
              />
            )}

            <Button variant="default" size="sm" className="w-full" onClick={handleTest}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run Test
            </Button>

            {testResult && (
              <div
                className={`rounded-md border px-3 py-2 text-xs font-mono whitespace-pre-wrap ${
                  testResult.ok
                    ? "border-green-500/30 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                    : "border-destructive/30 bg-red-50 dark:bg-red-950/20 text-destructive"
                }`}
              >
                <span className="font-semibold block mb-1">
                  {testResult.ok ? "Output:" : "Error:"}
                </span>
                {testResult.output}
              </div>
            )}

            {/* Available field keys */}
            {allFieldNames && allFieldNames.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3">
                <Label className="text-xs font-semibold">Available Keys</Label>
                <div className="flex flex-wrap gap-1">
                  {allFieldNames.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors"
                      title={`${f.label} — click to copy`}
                      onClick={() => navigator.clipboard.writeText(f.name)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground">Click to copy key</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditorValue(template);
              setTestResult(null);
            }}
          >
            Reset to Template
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(editorValue);
              onClose();
            }}
          >
            Save Hook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline trigger used in PropertyPanel ──────────────────────

interface HookButtonProps {
  hookType: HookType;
  code: string | undefined;
  onSave: (code: string) => void;
  onClear: () => void;
  field: FieldSchema;
  allFieldNames?: { name: string; label: string }[];
}

export function HookButton({ hookType, code, onSave, onClear, field, allFieldNames }: HookButtonProps) {
  const [open, setOpen] = useState(false);
  const hasCode = !!code && code.trim().length > 0;
  const label = hookType === "beforePreload" ? "Before Preload"
    : hookType === "beforeSubmit" ? "Before Submit"
    : hookType === "sideEffect" ? "Side Effect"
    : "Custom Validation";

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant={hasCode ? "default" : "outline"}
          size="sm"
          className="h-7 text-[11px] flex-1"
          onClick={() => setOpen(true)}
        >
          {label}
          {hasCode && <span className="ml-1 opacity-70">*</span>}
        </Button>
        {hasCode && (
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-destructive px-1"
            onClick={onClear}
            title="Remove hook"
          >
            clear
          </button>
        )}
      </div>

      {open && (
        <HookEditorDialog
          hookType={hookType}
          code={code ?? ""}
          onSave={onSave}
          onClose={() => setOpen(false)}
          field={field}
          allFieldNames={allFieldNames}
        />
      )}
    </>
  );
}
