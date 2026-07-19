import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactCustomFormBuilder } from "./ReactCustomFormBuilder";
import { ReactCustomFormBuilderPreview } from "./ReactCustomFormBuilderPreview";
import type { FormSchema } from "./types";

interface ReactCustomFormBuilderDialogProps {
  mode: "builder" | "preview";
  title?: string;
  description?: string;
  triggerLabel?: string;
  trigger?: ReactNode;

  // Builder mode props
  initialSchema?: FormSchema;
  onSave?: (schema: FormSchema) => void;
  saving?: boolean;

  // Preview mode props
  schema?: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
}

export function ReactCustomFormBuilderDialog({
  mode,
  title,
  description,
  triggerLabel,
  trigger,
  initialSchema,
  onSave,
  saving,
  schema,
  initialValues,
  onSubmit,
}: ReactCustomFormBuilderDialogProps) {
  const [open, setOpen] = useState(false);

  const dialogTitle =
    title ?? (mode === "builder" ? "Form Builder" : "Form Preview");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>
          {triggerLabel ?? (mode === "builder" ? "Open Builder" : "Open Form")}
        </Button>
      )}
      <DialogContent className={mode === "builder" ? "max-w-6xl h-[85vh] flex flex-col" : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {mode === "builder" && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ReactCustomFormBuilder
              initialSchema={initialSchema}
              onSave={(s) => {
                onSave?.(s);
                setOpen(false);
              }}
              saving={saving}
              className="h-full"
            />
          </div>
        )}

        {mode === "preview" && schema && (
          <ReactCustomFormBuilderPreview
            schema={schema}
            initialValues={initialValues}
            onSubmit={(v) => {
              onSubmit?.(v);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
