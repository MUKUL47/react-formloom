import type { FC } from "react";
import type { LucideIcon } from "lucide-react";

// ── Schema types ──────────────────────────────────────────────

export type FieldType =
  | "input"
  | "textarea"
  | "number"
  | "select"
  | "multiSelect"
  | "checkbox"
  | "switch"
  | "datePicker"
  | "timePicker"
  | "password"
  | "email"
  | "phone"
  | "url"
  | "radio"
  | "slider"
  | "file"
  | "divider"
  | "heading"
  | "paragraph"
  | "hidden"
  | "dateRange"
  | "section"
  | "columns"
  | "array"
  | "tabs"
  | "userPicker"
  | "calendar"
  | "branchPicker"
  | "compensationStructure"
  | "coordinatePicker";

export interface FieldOption {
  label: string;
  value: string;
}

export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "url"
    | "numeric"
    | "alphanumeric"
    | "fileMaxSize"
    | "fileTypes"
    | "fileMinCount"
    | "fileMaxCount";
  value?: unknown;
  message: string;
}

export interface TabDefinition {
  key: string;
  label: string;
  fields: FieldSchema[];
}

export interface FieldHooks {
  /** JS function body. Args: (value, fieldName, allValues). Must return transformed value. */
  beforePreload?: string;
  /** JS function body. Args: (value, fieldName, allValues). Must return transformed value. */
  beforeSubmit?: string;
  /** JS function body. Args: (value, fieldName, allValues). Return true=pass, false="Invalid value", string=custom error. */
  validate?: string;
  /** JS function body. Args: (value, fieldName, allValues). Return { hide: string[], disable: string[] }. Keys in hide/disable are excluded from submission. */
  sideEffect?: string;
}

export interface FieldSchema {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  helpText?: string;
  tooltip?: string;
  readOnly?: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  props?: Record<string, unknown>;
  tabs?: TabDefinition[];
  children?: FieldSchema[];
  hooks?: FieldHooks;
  /**
   * Freeform metadata for external consumers (backend, AI, integrations).
   * The builder stores it as-is, never interprets it.
   * Example: { dataSource: "users", mapTo: "employee_id", type: "dropdown" }
   */
  meta?: Record<string, unknown>;
}

export interface FieldSummary {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  meta?: Record<string, unknown>;
}

export interface FormSchema {
  version: 1;
  fields: FieldSchema[];
  globalHooks?: {
    beforePreload?: string;
    beforeSubmit?: string;
    validate?: string;
  };
  /** Flat list of ALL field names/types across all containers. Auto-computed on export. */
  allFields?: FieldSummary[];
}

// ── Registry types ────────────────────────────────────────────

export type FieldCategory = "input" | "selection" | "layout" | "display" | "widget";

export interface CanvasFieldProps {
  field: FieldSchema;
  selected: boolean;
}

export interface RuntimeFieldProps {
  field: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Widgets call this to expose rich data (e.g. full selected object) to sideEffect hooks via the 4th `widgetData` argument */
  onWidgetDataChange?: (data: unknown) => void;
  /** Factory for containers to forward onWidgetDataChange to nested fields */
  widgetDataFactory?: (fieldName: string) => (data: unknown) => void;
  error?: string;
  disabled?: boolean;
  /** Flat errors map from parent form — used by containers to pass errors to nested fields */
  allErrors?: Record<string, string>;
  /** Side effect sets from parent form — used by containers to hide/disable nested fields */
  sideEffects?: { hidden: Set<string>; disabled: Set<string>; required: Set<string> };
}

export interface PropertyFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "options-editor" | "tabs-editor" | "validation-editor";
  selectOptions?: FieldOption[];
  condition?: (field: FieldSchema) => boolean;
}

export interface FieldDefinition {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  category: FieldCategory;
  defaultSchema: Partial<FieldSchema>;
  CanvasComponent: FC<CanvasFieldProps>;
  RuntimeComponent: FC<RuntimeFieldProps>;
  propertyFields: PropertyFieldConfig[];
}

// ── Builder state ─────────────────────────────────────────────

export interface NavSegment {
  fieldId: string;
  tabKey?: string;
  label: string;
}

export interface BuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
  navPath: NavSegment[];
}

export type BuilderAction =
  | { type: "ADD_FIELD"; field: FieldSchema; index: number }
  | { type: "DUPLICATE_FIELD"; fieldId: string }
  | { type: "REMOVE_FIELD"; fieldId: string }
  | { type: "MOVE_FIELD"; activeId: string; overIndex: number }
  | { type: "UPDATE_FIELD"; fieldId: string; changes: Partial<FieldSchema> }
  | { type: "SELECT_FIELD"; fieldId: string | null }
  | { type: "UPDATE_SCHEMA"; changes: Partial<FormSchema> }
  | { type: "LOAD_SCHEMA"; schema: FormSchema }
  | { type: "NAVIGATE_INTO"; fieldId: string; tabKey?: string; label: string }
  | { type: "NAVIGATE_TO"; depth: number }
  | { type: "MOVE_TO_CONTAINER"; fieldId: string; targetFieldId: string; targetTabKey?: string }
  | { type: "MOVE_TO_ROOT"; fieldId: string }
  | { type: "UNDO" }
  | { type: "REDO" };
