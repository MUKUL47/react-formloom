import { FormBuilderProvider } from "./builder/FormBuilderProvider";
import { FormBuilderShell } from "./builder/FormBuilderShell";
import type { FormSchema } from "./types";
import type { ReactNode } from "react";

export type BuilderTheme = "light" | "dark" | "system";

interface ReactCustomFormBuilderProps {
  initialSchema?: FormSchema;
  /** Called when user clicks Save */
  onSave?: (schema: FormSchema) => void;
  /** Called on every schema change (live) */
  onChange?: (schema: FormSchema) => void;
  saving?: boolean;
  extraActions?: ReactNode;
  className?: string;
  /** Control theme from outside. "system" follows OS preference. Default: "system" */
  theme?: BuilderTheme;
  /** Called when the user toggles the theme via the toolbar button */
  onThemeChange?: (theme: BuilderTheme) => void;
}

export function ReactCustomFormBuilder({
  initialSchema,
  onSave,
  onChange,
  saving,
  extraActions,
  className,
  theme = "system",
  onThemeChange,
}: ReactCustomFormBuilderProps) {
  return (
    <div className={className} style={{ minHeight: 500, height: "100%" }}>
      <FormBuilderProvider initialSchema={initialSchema} onChange={onChange}>
        <FormBuilderShell
          onSave={onSave}
          saving={saving}
          extraActions={extraActions}
          theme={theme}
          onThemeChange={onThemeChange}
        />
      </FormBuilderProvider>
    </div>
  );
}
