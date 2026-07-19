# Backend validation — `formloom/validator`

Validate `formloom` submissions with [Zod](https://zod.dev) — because **client-side validation is a UX feature, not a security boundary**.

The builder exports a plain-JSON `FormSchema`. The **same** schema drives validation on both ends:

```
client  ─ renderer ─▶ schemaToZod(schema).safeParse(values)
                             │  (identical rules)
server  ─ handler  ─▶ schemaToZod(schema).safeParse(req.body)
```

## The validator is a standalone export

`schemaToZod` ships as its own entry point that pulls in **no React and no renderer code** — only `zod` (an optional peer dependency). Import it anywhere:

```ts
import { schemaToZod } from "formloom/validator";
```

It is deliberately just a converter — it returns a `z.ZodObject`. You call `parse` / `safeParse`, flatten errors, and cache it however you like. There's no built-in `validate()` wrapper.

```ts
import { schemaToZod } from "formloom/validator";

const validator = schemaToZod(formSchema); // formSchema loaded from your DB
const result = validator.safeParse(req.body.data);

if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten().fieldErrors });
}
await db.insert({ formId, data: result.data }); // cleaned: stray keys stripped
```

> This example imports the validator straight from the repo source (`../../src/validator/schema-to-zod`) so it runs without a build step — single source of truth, no copy to drift. In your app, import from `formloom/validator` instead; it's identical.

## Injecting validation for widgets & custom fields

`options.inject` adds or replaces validation, keyed by field type or `meta.widget` name — for **any** field, built-in or widget. Each entry receives `(field, base)`; return `base` refined to tighten a built-in, or a fresh schema to define a widget:

```ts
import { z } from "zod";

schemaToZod(formSchema, {
  inject: {
    email:   (_f, base) => base.endsWith("@acme.com"), // tighten a built-in
    rating:  () => z.number().int().min(0).max(5),      // define a widget
    country: (f) => (f.props?.multiple ? z.array(z.string()) : z.string()),
  },
});
```

A widget with no `inject` handler defaults to `z.unknown()` (accept anything), so a new widget never breaks the rest. Set `unknownField: "strip"` to drop it, or `"error"` to throw.

## Run it

```bash
cd examples/backend
npm install
npm start     # demo: valid + invalid submissions (incl. the injected rating rule)
```

The validator's own test suite lives next to the source — run it from the repo root:

```bash
npm run test:validator
```

Requires **Zod v4** (`z.email()`, `z.url()`, `error.flatten()`).

## Behaviour that trips people up

| Behaviour | Why |
|-----------|-----|
| **Containers flatten** | `section` / `columns` / `tabs` children validate as **top-level keys** (the renderer flattens them on submit). The container's own `name` is never a key. |
| **`array` stays nested** | An `array` field's value is a real nested array: `items: [{ … }]`. |
| **Everything `.optional()` by default** | "Required" is a client UX rule. Pass `{ enforceRequired: true }` to hard-reject empties server-side. |
| **Unknown keys stripped, not rejected** | Uses `.strip()` so legacy/duplicate keys don't fail the whole submission. |
| **Display fields skipped** | `divider` / `heading` / `paragraph` carry no data. `hidden` **is** validated. |
| **Files are references** | The persisted value is a URL/id string; size/type/count are enforced at upload time. |
| **Widgets / custom types** | Default to `z.unknown()`; tighten via `options.inject`. |

## Field type → Zod mapping

| Field type | Zod |
|-----------|-----|
| `input`, `textarea`, `password`, `phone` | `z.string()` + rules |
| `email` / `url` | `z.email()` / `z.url()` |
| `number`, `slider` | `z.number()` + `min`/`max` **validation rules** (not `props.min/max`) |
| `select`, `radio` | `z.enum(options)` |
| `multiSelect` | `z.array(z.enum(options))` |
| `checkbox`, `switch` | `z.boolean()` |
| `datePicker` / `timePicker` | ISO date / `HH:mm` string |
| `dateRange` | `{ start?, end? }` |
| `file` | `z.string() \| z.string[]` |
| `hidden` | `z.unknown()` |
| `section` / `columns` / `tabs` | flattened — children become top-level keys |
| `array` | `z.array(z.object(childShape))` |
| `divider` / `heading` / `paragraph` | skipped |
| widget / custom | `options.inject[type]`, else `z.unknown()` |
