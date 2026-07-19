import type { FieldDefinition, FieldType, FieldCategory, FieldSchema } from "./types";

const fieldRegistry = new Map<FieldType, FieldDefinition>();

export function registerField(def: FieldDefinition) {
  fieldRegistry.set(def.type, def);
}

export function getField(type: FieldType): FieldDefinition | undefined {
  return fieldRegistry.get(type);
}

export function getAllFields(): FieldDefinition[] {
  return Array.from(fieldRegistry.values());
}

export function getFieldsByCategory(): Record<string, FieldDefinition[]> {
  const grouped: Record<string, FieldDefinition[]> = {};
  for (const def of fieldRegistry.values()) {
    const cat = def.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(def);
  }
  return grouped;
}

let idCounter = 0;

function randomHex(len: number): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

export function generateFieldId(): string {
  return `field_${Date.now().toString(36)}${randomHex(4)}_${(idCounter++).toString(36)}`;
}

export function createFieldSchema(type: FieldType): FieldSchema | null {
  const def = getField(type);
  if (!def) return null;
  const id = generateFieldId();
  const suffix = randomHex(6);
  return {
    id,
    name: `${type}_${suffix}`,
    type,
    label: def.label,
    ...def.defaultSchema,
  };
}

/** Collect all field names recursively (including inside tabs and sections) */
export function collectAllFieldNames(
  fields: FieldSchema[],
  exclude?: string,
): Set<string> {
  const names = new Set<string>();

  function walk(list: FieldSchema[]) {
    for (const f of list) {
      if (f.id !== exclude) names.add(f.name);
      if (f.tabs) for (const tab of f.tabs) walk(tab.fields);
      if (f.children) walk(f.children);
    }
  }

  walk(fields);
  return names;
}

// Display-only types that don't produce data
const NON_DATA_TYPES = new Set(["divider", "heading", "paragraph", "hidden", "section", "columns", "tabs"]);

/** Collect all data field { name, label } pairs recursively, excluding a given ID and non-data types */
export function collectAllFieldMeta(
  fields: FieldSchema[],
  excludeId?: string,
): { name: string; label: string }[] {
  const result: { name: string; label: string }[] = [];

  function walk(list: FieldSchema[]) {
    for (const f of list) {
      if (f.id !== excludeId && !NON_DATA_TYPES.has(f.type)) result.push({ name: f.name, label: f.label });
      if (f.tabs) for (const tab of f.tabs) walk(tab.fields);
      if (f.children) walk(f.children);
    }
  }

  walk(fields);
  return result;
}

/**
 * Compute the flat `allFields` summary for a FormSchema.
 * Recursively walks tabs and sections. Excludes display-only types.
 * Attach this to schema before saving/exporting so backend never needs to BFS.
 */
export function computeAllFields(
  fields: FieldSchema[],
): import("./types").FieldSummary[] {
  const result: import("./types").FieldSummary[] = [];

  function walk(list: FieldSchema[]) {
    for (const f of list) {
      if (!NON_DATA_TYPES.has(f.type)) {
        result.push({
          name: f.name,
          type: f.type,
          label: f.label,
          ...(f.required ? { required: true } : {}),
          ...(f.meta && Object.keys(f.meta).length > 0 ? { meta: f.meta } : {}),
        });
      }
      if (f.tabs) for (const tab of f.tabs) walk(tab.fields);
      if (f.children) walk(f.children);
    }
  }

  walk(fields);
  return result;
}

/** Attach `allFields` to a schema (returns new object, doesn't mutate) */
export function withAllFields(schema: import("./types").FormSchema): import("./types").FormSchema {
  return { ...schema, allFields: computeAllFields(schema.fields) };
}
