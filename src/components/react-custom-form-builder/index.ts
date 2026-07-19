// Public API — wrapped components (recommended)
export { ReactCustomFormBuilder } from "./ReactCustomFormBuilder";
export type { BuilderTheme } from "./ReactCustomFormBuilder";
export { ReactCustomFormBuilderPreview } from "./ReactCustomFormBuilderPreview";
export { ReactCustomFormBuilderDialog } from "./ReactCustomFormBuilderDialog";
export { ReactCustomFormBuilderWithPreview } from "./ReactCustomFormBuilderWithPreview";
export { FormRenderer } from "./renderer/FormRenderer";

// Optional: lets `file` fields show the files already uploaded against them.
export { AttachmentsProvider, useAttachments } from "./attachments";
export type { AttachmentsApi, ExistingAttachment } from "./attachments";

// Raw builder internals — for advanced/custom integrations
export { FormBuilderProvider, useBuilder } from "./builder/FormBuilderProvider";
export { FormBuilderShell } from "./builder/FormBuilderShell";
export { Palette } from "./builder/Palette";
export { Canvas } from "./builder/Canvas";
export { PropertyPanel } from "./builder/PropertyPanel";
export { BuilderToolbar } from "./builder/BuilderToolbar";

// Types
export type {
  FormSchema,
  FieldSchema,
  FieldType,
  FieldOption,
  ValidationRule,
  FieldDefinition,
  FieldSummary,
  FieldHooks,
  TabDefinition,
  FieldCategory,
  // Props contracts for custom fields & widgets
  RuntimeFieldProps,
  CanvasFieldProps,
  PropertyFieldConfig,
} from "./types";

// Registry (for extending with custom field types)
export { registerField, getField, getAllFields, computeAllFields, withAllFields } from "./registry";

// Widget Bridge (for external component integration).
// NOTE: the DataSource registry was dropped — a Widget does the same job.
export {
  registerWidget,
  getWidget,
  getAllWidgets,
  getWidgetNames,
} from "./data-source";
export type { WidgetConfig } from "./data-source";

// No built-in widgets — register your own with `registerWidget` / `registerField`.
