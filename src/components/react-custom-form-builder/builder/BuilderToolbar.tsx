import { Undo2, Redo2, Code2, Save, Download, Upload, Sun, Moon } from "lucide-react";
import type { BuilderTheme } from "../ReactCustomFormBuilder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { withAllFields } from "../registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBuilder } from "./FormBuilderProvider";
import { useState } from "react";
import type { FormSchema } from "../types";

interface BuilderToolbarProps {
  onSave?: (schema: FormSchema) => void;
  saving?: boolean;
  extraActions?: React.ReactNode;
  theme?: BuilderTheme;
  onThemeChange?: (theme: BuilderTheme) => void;
}

export function BuilderToolbar({ onSave, saving, extraActions, theme = "system", onThemeChange }: BuilderToolbarProps) {
  const { state, dispatch, canUndo, canRedo } = useBuilder();
  const [showJson, setShowJson] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const json = JSON.stringify(withAllFields(state.schema), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportApply = () => {
    try {
      const schema = JSON.parse(importText) as FormSchema;
      if (!schema || !Array.isArray(schema.fields)) {
        setImportError("Invalid schema: must have a \"fields\" array");
        return;
      }
      schema.version = 1;
      dispatch({ type: "LOAD_SCHEMA", schema });
      setImportOpen(false);
      setImportText("");
      setImportError("");
    } catch (e: any) {
      setImportError(`Invalid JSON: ${e.message}`);
    }
  };

  const Sep = () => <div className="h-5 w-px bg-border/60 mx-1" aria-hidden />;

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" aria-label="Undo (Ctrl+Z)" className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-primary/40" disabled={!canUndo} onClick={() => dispatch({ type: "UNDO" })} title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Redo (Ctrl+Shift+Z)" className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-primary/40" disabled={!canRedo} onClick={() => dispatch({ type: "REDO" })} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Sep />
          <Button variant="ghost" size="sm" aria-pressed={showJson} className="h-7 px-2 text-[11px] tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => setShowJson(!showJson)}>
            <Code2 className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
          <Sep />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40" onClick={handleExport} title="Copy schema JSON to clipboard">
            <Download className="h-3.5 w-3.5 mr-1" />
            {copied ? "Copied!" : "Export"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] tracking-tight focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Paste / import schema JSON"
            onClick={() => { setImportText(""); setImportError(""); setImportOpen(true); }}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Import
          </Button>
          {onThemeChange && (
            <>
              <Sep />
              <Button
                variant="ghost"
                size="sm"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-primary/40"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums tracking-tight text-muted-foreground/70">
            {state.schema.fields.length.toString().padStart(2, "0")} fields
          </span>
          {extraActions}
          {onSave && (
            <Button
              size="sm"
              className="h-7 text-[11px] tracking-tight px-3 focus-visible:ring-2 focus-visible:ring-primary/40"
              disabled={saving || state.schema.fields.length === 0}
              onClick={() => onSave(withAllFields(state.schema))}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>

      {showJson && (
        <div className="border-b border-border/60 bg-muted/40 p-3 max-h-56 overflow-auto [overscroll-behavior:contain]">
          <pre className="text-[11px] text-foreground/80 font-mono whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(withAllFields(state.schema), null, 2)}
          </pre>
        </div>
      )}

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Schema</DialogTitle>
            <DialogDescription>Paste a form schema JSON below to load it into the builder.</DialogDescription>
          </DialogHeader>
          <Textarea
            className="font-mono text-xs min-h-[250px] resize-y"
            placeholder='{ "version": 1, "fields": [ ... ] }'
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
          />
          {importError && (
            <p className="text-xs text-destructive">{importError}</p>
          )}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleImportApply} disabled={!importText.trim()}>
              Load Schema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
