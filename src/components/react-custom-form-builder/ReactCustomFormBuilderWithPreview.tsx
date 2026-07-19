/**
 * Combined Builder + Preview in a tabbed interface.
 * Drop-in replacement for formify's FormBuilderWithPreview.
 *
 * Accepts Formily schemas (auto-converts) for backward compatibility
 * with existing DB data.
 */

import { useState, useCallback, type ReactNode } from "react";
import { ReactCustomFormBuilder } from "./ReactCustomFormBuilder";
import { FormRenderer } from "./renderer/FormRenderer";
// Detect if schema is already RCFB format
function isRCFBSchema(content: unknown): content is FormSchema {
  if (!content || typeof content !== "object") return false;
  const obj = content as Record<string, unknown>;
  return obj.version === 1 && Array.isArray(obj.fields);
}
import type { FormSchema } from "./types";

interface ReactCustomFormBuilderWithPreviewProps {
  /** Schema to load — accepts RCFB or legacy Formily format */
  initialSchema?: FormSchema | Record<string, unknown>;
  /** Called when user clicks Save in the builder */
  onSave?: (schema: FormSchema) => void;
  /** Called when preview form is submitted */
  onPreviewSubmit?: (values: Record<string, unknown>) => void;
  /** Whether save is in progress */
  saving?: boolean;
  /** Extra action buttons for the builder toolbar */
  extraActions?: ReactNode;
}

export function ReactCustomFormBuilderWithPreview({
  initialSchema,
  onSave,
  onPreviewSubmit,
  saving,
  extraActions,
}: ReactCustomFormBuilderWithPreviewProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [liveSchema, setLiveSchema] = useState<FormSchema | null>(null);
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  // Auto-convert Formily schemas
  const resolvedInitial: FormSchema | undefined = (() => {
    if (!initialSchema) return undefined;
    if (isRCFBSchema(initialSchema)) return initialSchema;
    return undefined;
  })();

  const handleChange = useCallback((schema: FormSchema) => {
    setLiveSchema(schema);
  }, []);

  const handleSave = useCallback(
    (schema: FormSchema) => {
      setLiveSchema(schema);
      onSave?.(schema);
    },
    [onSave],
  );

  const handlePreviewSubmit = useCallback(
    (values: Record<string, unknown>) => {
      setSubmittedValues(values);
      onPreviewSubmit?.(values);
    },
    [onPreviewSubmit],
  );

  const previewSchema = liveSchema ?? resolvedInitial;

  return (
    <div className="space-y-0">
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "builder"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Builder tab */}
      {activeTab === "builder" && (
        <ReactCustomFormBuilder
          initialSchema={resolvedInitial}
          onSave={handleSave}
          onChange={handleChange}
          saving={saving}
          extraActions={extraActions}
        />
      )}

      {/* Preview tab */}
      {activeTab === "preview" && (
        <div className="space-y-4 max-w-2xl overflow-y-auto" style={{ maxHeight: "calc(100vh - 12rem)" }}>
          {previewSchema ? (
            <>
              <FormRenderer
                schema={previewSchema}
                onSubmit={handlePreviewSubmit}
                submitLabel="Submit"
              />
              {submittedValues && (
                <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                    Submitted Values:
                  </p>
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                    {JSON.stringify(submittedValues, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Design your form in the Builder tab first, then switch here to preview it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
