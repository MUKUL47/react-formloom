import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  BuilderState,
  BuilderAction,
  FormSchema,
  FieldSchema,
  NavSegment,
} from "../types";

const MAX_HISTORY = 25;

function pushHistory(state: BuilderState, schema: FormSchema): BuilderState {
  const history = state.history.slice(0, state.historyIndex + 1);
  history.push(structuredClone(schema));
  if (history.length > MAX_HISTORY) history.shift();
  return { ...state, schema, history, historyIndex: history.length - 1 };
}

/** Resolve the fields array at the current navigation path */
function resolveFields(
  schema: FormSchema,
  navPath: NavSegment[],
): FieldSchema[] {
  let fields = schema.fields;
  for (const seg of navPath) {
    const parent = fields.find((f) => f.id === seg.fieldId);
    if (!parent) return [];
    if (seg.tabKey && parent.tabs) {
      const tab = parent.tabs.find((t) => t.key === seg.tabKey);
      fields = tab?.fields ?? [];
    } else if (parent.children) {
      fields = parent.children;
    } else {
      return [];
    }
  }
  return fields;
}

/** Apply a mutation to the fields at the current nav path, returning a new schema */
function updateFieldsAtPath(
  schema: FormSchema,
  navPath: NavSegment[],
  updater: (fields: FieldSchema[]) => FieldSchema[],
): FormSchema {
  if (navPath.length === 0) {
    return { ...schema, fields: updater(schema.fields) };
  }

  const newFields = [...schema.fields];

  function walk(fields: FieldSchema[], pathIdx: number): FieldSchema[] {
    const seg = navPath[pathIdx];
    return fields.map((f) => {
      if (f.id !== seg.fieldId) return f;

      if (seg.tabKey && f.tabs) {
        const newTabs = f.tabs.map((tab) => {
          if (tab.key !== seg.tabKey) return tab;
          if (pathIdx === navPath.length - 1) {
            return { ...tab, fields: updater(tab.fields) };
          }
          return { ...tab, fields: walk(tab.fields, pathIdx + 1) };
        });
        return { ...f, tabs: newTabs };
      }

      if (f.children) {
        if (pathIdx === navPath.length - 1) {
          return { ...f, children: updater(f.children) };
        }
        return { ...f, children: walk(f.children, pathIdx + 1) };
      }

      return f;
    });
  }

  return { ...schema, fields: walk(newFields, 0) };
}

function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case "ADD_FIELD": {
      const newSchema = updateFieldsAtPath(
        state.schema,
        state.navPath,
        (fields) => {
          const copy = [...fields];
          copy.splice(action.index, 0, action.field);
          return copy;
        },
      );
      return {
        ...pushHistory(state, newSchema),
        selectedFieldId: action.field.id,
      };
    }
    case "DUPLICATE_FIELD": {
      const currentFields = resolveFields(state.schema, state.navPath);
      const idx = currentFields.findIndex((f) => f.id === action.fieldId);
      if (idx === -1) return state;
      const original = currentFields[idx];
      const newId = `field_${Date.now().toString(36)}_dup`;
      const clone = {
        ...structuredClone(original),
        id: newId,
        name: `${original.name}_copy`,
      };
      const newSchema = updateFieldsAtPath(
        state.schema,
        state.navPath,
        (fields) => {
          const copy = [...fields];
          copy.splice(idx + 1, 0, clone);
          return copy;
        },
      );
      return { ...pushHistory(state, newSchema), selectedFieldId: newId };
    }
    case "REMOVE_FIELD": {
      const newSchema = updateFieldsAtPath(
        state.schema,
        state.navPath,
        (fields) => fields.filter((f) => f.id !== action.fieldId),
      );
      return {
        ...pushHistory(state, newSchema),
        selectedFieldId:
          state.selectedFieldId === action.fieldId
            ? null
            : state.selectedFieldId,
      };
    }
    case "MOVE_FIELD": {
      const newSchema = updateFieldsAtPath(
        state.schema,
        state.navPath,
        (fields) => {
          const copy = [...fields];
          const oldIdx = copy.findIndex((f) => f.id === action.activeId);
          if (oldIdx === -1) return fields;
          const [moved] = copy.splice(oldIdx, 1);
          copy.splice(action.overIndex, 0, moved);
          return copy;
        },
      );
      return pushHistory(state, newSchema);
    }
    case "UPDATE_FIELD": {
      const newSchema = updateFieldsAtPath(
        state.schema,
        state.navPath,
        (fields) =>
          fields.map((f) =>
            f.id === action.fieldId ? { ...f, ...action.changes } : f,
          ),
      );
      return pushHistory(state, newSchema);
    }
    case "UPDATE_SCHEMA": {
      const newSchema = { ...state.schema, ...action.changes };
      return pushHistory(state, newSchema);
    }
    case "SELECT_FIELD":
      return { ...state, selectedFieldId: action.fieldId };

    case "NAVIGATE_INTO":
      return {
        ...state,
        selectedFieldId: null,
        navPath: [
          ...state.navPath,
          {
            fieldId: action.fieldId,
            tabKey: action.tabKey,
            label: action.label,
          },
        ],
      };
    case "NAVIGATE_TO":
      return {
        ...state,
        selectedFieldId: null,
        navPath: state.navPath.slice(0, action.depth),
      };

    case "MOVE_TO_CONTAINER": {
      // Remove field from anywhere in the schema, insert into target container
      let movedField: FieldSchema | null = null;

      const removeFrom = (fields: FieldSchema[]): FieldSchema[] =>
        fields.reduce<FieldSchema[]>((acc, f) => {
          if (f.id === action.fieldId) { movedField = f; return acc; }
          const updated = { ...f };
          if (updated.children) updated.children = removeFrom(updated.children);
          if (updated.tabs) updated.tabs = updated.tabs.map((t) => ({ ...t, fields: removeFrom(t.fields) }));
          acc.push(updated);
          return acc;
        }, []);

      const insertInto = (fields: FieldSchema[]): FieldSchema[] =>
        fields.map((f) => {
          if (f.id === action.targetFieldId) {
            if (action.targetTabKey && f.tabs) {
              return { ...f, tabs: f.tabs.map((t) => t.key === action.targetTabKey ? { ...t, fields: [...t.fields, movedField!] } : t) };
            }
            return { ...f, children: [...(f.children ?? []), movedField!] };
          }
          const updated = { ...f };
          if (updated.children) updated.children = insertInto(updated.children);
          if (updated.tabs) updated.tabs = updated.tabs.map((t) => ({ ...t, fields: insertInto(t.fields) }));
          return updated;
        });

      let newFields = removeFrom(state.schema.fields);
      if (!movedField) return state;
      newFields = insertInto(newFields);
      return { ...pushHistory(state, { ...state.schema, fields: newFields }), selectedFieldId: null };
    }

    case "MOVE_TO_ROOT": {
      let movedField: FieldSchema | null = null;
      const removeFrom = (fields: FieldSchema[]): FieldSchema[] =>
        fields.reduce<FieldSchema[]>((acc, f) => {
          if (f.id === action.fieldId) { movedField = f; return acc; }
          const updated = { ...f };
          if (updated.children) updated.children = removeFrom(updated.children);
          if (updated.tabs) updated.tabs = updated.tabs.map((t) => ({ ...t, fields: removeFrom(t.fields) }));
          acc.push(updated);
          return acc;
        }, []);

      const newFields = removeFrom(state.schema.fields);
      if (!movedField) return state;
      newFields.push(movedField);
      return { ...pushHistory(state, { ...state.schema, fields: newFields }), selectedFieldId: null };
    }

    case "LOAD_SCHEMA":
      return {
        schema: action.schema,
        selectedFieldId: null,
        history: [structuredClone(action.schema)],
        historyIndex: 0,
        navPath: [],
      };
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const idx = state.historyIndex - 1;
      return {
        ...state,
        schema: structuredClone(state.history[idx]),
        historyIndex: idx,
        selectedFieldId: null,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      return {
        ...state,
        schema: structuredClone(state.history[idx]),
        historyIndex: idx,
        selectedFieldId: null,
      };
    }
    default:
      return state;
  }
}

interface BuilderContextValue {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  currentFields: FieldSchema[];
  selectedField: FieldSchema | null;
  canUndo: boolean;
  canRedo: boolean;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx)
    throw new Error("useBuilder must be used within FormBuilderProvider");
  return ctx;
}

const emptySchema: FormSchema = { version: 1, fields: [] };

export function FormBuilderProvider({
  initialSchema,
  onChange,
  children,
}: {
  initialSchema?: FormSchema;
  onChange?: (schema: FormSchema) => void;
  children: ReactNode;
}) {
  const init = initialSchema ?? emptySchema;
  const [state, dispatch] = useReducer(builderReducer, {
    schema: init,
    selectedFieldId: null,
    history: [structuredClone(init)],
    historyIndex: 0,
    navPath: [],
  });

  // Fire onChange on every schema mutation
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const prevSchemaRef = useRef(state.schema);
  useEffect(() => {
    if (state.schema !== prevSchemaRef.current) {
      prevSchemaRef.current = state.schema;
      onChangeRef.current?.(state.schema);
    }
  }, [state.schema]);

  const currentFields = resolveFields(state.schema, state.navPath);
  const selectedField =
    currentFields.find((f) => f.id === state.selectedFieldId) ?? null;
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <BuilderContext.Provider
      value={{
        state,
        dispatch,
        currentFields,
        selectedField,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
