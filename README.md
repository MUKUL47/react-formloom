# formloom

Two things in one package:

1. **A React form builder + renderer** — design forms visually, get back plain JSON, render it anywhere.
2. **A standalone `schema → Zod` validator** — re-check submissions on your server, React-free, one dependency.

```bash
npm install formloom
```

> **Installing just for the validator?** You get nothing but `zod`. All of the builder's React UI libraries are **optional peer dependencies** — they are only pulled in if you actually install them for the renderer (see [Part 1](#1-form-builder--renderer)).

---

## 1. Form builder & renderer

Design forms with a drag-and-drop builder, save a `FormSchema` (plain JSON), and run it with `<FormRenderer>`. 24 field types, per-field & global hooks, reactive side effects, sections / tabs / arrays, custom widgets, file uploads, and dark mode.

### 👉 Live demo & full docs: **[mukul47.github.io/react-formloom](https://mukul47.github.io/react-formloom/)**

Everything about the UI half — every field type, hooks, side effects, widgets, theming, styling, and an interactive playground — lives on the docs site. A quick taste:

```tsx
import { useState } from "react";
import { ReactCustomFormBuilder, FormRenderer, type FormSchema } from "formloom";
import "formloom/styles.css"; // once, anywhere

export function BuilderPage() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  return (
    <>
      <ReactCustomFormBuilder onSave={setSchema} />
      {schema && <FormRenderer schema={schema} onSubmit={(v) => console.log(v)} />}
    </>
  );
}
```

**Peer dependencies for this half** (optional, so validator-only installs stay lean): `react` & `react-dom` (>=18) plus the builder's UI libraries — `@dnd-kit/*`, `@radix-ui/*`, `lucide-react`, `cmdk`, `class-variance-authority`, `clsx`, `tailwind-merge`, and (optionally) `date-fns` + `react-day-picker` for date fields and `@monaco-editor/react` for the hook editor. Install guide and the exact list are on the [docs site](https://mukul47.github.io/react-formloom/).

---

## 2. Validator — `formloom/validator`

Client validation is a UX feature, **not** a security boundary. Re-validate every submission on the server against the **same** schema the builder produced. This is a separate entry point that imports **no React and no renderer code — only `zod`** (its single dependency), so it runs anywhere: a Node API, an edge function, a worker, or back in the browser.

```ts
import { schemaToZod } from "formloom/validator";

const validator = schemaToZod(formSchema);          // formSchema loaded from your DB
const result = validator.safeParse(req.body.data);

if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten().fieldErrors });
}
await db.insert({ formId, data: result.data });     // cleaned: stray keys stripped
```

It's a raw converter: `schemaToZod` returns a `z.ZodObject`. Everything else (`parse` / `safeParse`, caching, error flattening) is yours.

### What it mirrors — 1:1 with the renderer's declarative validation

The translator reproduces exactly what `<FormRenderer>` checks at submit time:

- **`required`** and the whole **`validation` rule array** — `minLength` / `maxLength`, `min` / `max`, `pattern`, `email` / `url` / `numeric` / `alphanumeric`, and the `file*` rules.
- **Array `minRows` / `maxRows`.**
- **Empty semantics:** `undefined` / `null` / `""` skip a *non-required* field's own rules (just like the renderer); a *required* field rejects them (including `[]`).
- **Structure:** `section` / `columns` / `tabs` children flatten to top-level keys; `array` stays nested (validated to any depth); `divider` / `heading` / `paragraph` are dropped; unknown keys are stripped.

It intentionally does **not** run your `validate` **hooks** (arbitrary JS you own — re-run those yourself) and ignores `props.min` / `props.max` spinner bounds, because the renderer treats those as UI hints, not validation.

### `inject` — add or replace validation

Keyed by field `type` **or** `meta.widget` name; runs for **any** matching field, built-in or widget. Each injector receives `(field, base)` where `base` is the Zod type the translator already computed — return `base` refined to **tighten an existing field**, or a fresh schema to **define a widget** from scratch.

```ts
import { z } from "zod";

schemaToZod(formSchema, {
  inject: {
    // TIGHTEN a built-in field — refine the base you were handed:
    email:   (_f, base) => base.endsWith("@acme.com"),
    // DEFINE a widget from scratch — ignore the base:
    rating:  () => z.number().int().min(0).max(5),
    country: (f) => (f.props?.multiple ? z.array(z.string()) : z.string()),
  },
});
```

### `unknownField` — widgets with no handler

Controls what happens to a widget / custom `registerField` type that has no `inject` entry:

```ts
schemaToZod(formSchema, {
  unknownField: "strip", // "passthrough" (default) · "strip" (drop key) · "error" (throw)
});
```

- **`passthrough`** (default) — keep the value as-is (`z.unknown()`).
- **`strip`** — drop the key from the output entirely.
- **`error`** — throw `UnknownFieldError` at translation time (fail loud in CI/build).

### Options

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `enforceRequired` | `boolean` | `false` | Reject empty/missing values for `required` fields. |
| `inject` | `Record<string, (field, base) => ZodType>` | — | Add or replace validation per field `type` / `meta.widget`. |
| `unknownField` | `"passthrough" \| "strip" \| "error"` | `"passthrough"` | Handling for unmapped widgets / custom types. |

### Runnable example & tests

A complete, framework-agnostic server example ships in [`examples/backend/`](examples/backend/):

```bash
cd examples/backend && npm install
npm start   # validate a good & a bad submission
```

The validator's own test suite lives next to the source — run it from the repo root:

```bash
npm run test:validator
```

---

## License

[MIT](LICENSE) © Mukul Dutt
