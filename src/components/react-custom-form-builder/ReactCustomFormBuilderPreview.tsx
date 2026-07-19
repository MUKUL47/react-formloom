import { FormRenderer } from "./renderer/FormRenderer";
import type { FormSchema } from "./types";
import { useState } from "react";
import { Check } from "lucide-react";

interface ReactCustomFormBuilderPreviewProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
  title?: string;
  showSubmittedData?: boolean;
}

export function ReactCustomFormBuilderPreview({
  schema,
  initialValues,
  onSubmit,
  title = "Form Preview",
  showSubmittedData = true,
}: ReactCustomFormBuilderPreviewProps) {
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = (values: Record<string, unknown>) => {
    setSubmittedValues(values);
    onSubmit?.(values);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        {title && (
          <h3 className="text-lg font-semibold mb-6 pb-3 border-b border-border">{title}</h3>
        )}
        <FormRenderer
          schema={schema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        />
      </div>

      {showSubmittedData && submittedValues && (
        <div className="rounded-lg border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Submitted successfully
            </p>
          </div>
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-background rounded-md p-3 border border-border">
            {JSON.stringify(submittedValues, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
