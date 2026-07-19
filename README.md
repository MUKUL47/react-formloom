# formloom

A React drag-and-drop **form builder + renderer**, plus a standalone **`schema → Zod` validator** for your server.

### 📖 Docs & live playground: **[mukul47.github.io/react-formloom](https://mukul47.github.io/react-formloom/)**

```bash
npm install formloom
```

## Builder & renderer

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

This half needs peer dependencies (`react`, `@dnd-kit/*`, `@radix-ui/*`, `lucide-react`, …) — they are **optional**, so a validator-only install pulls in nothing but `zod`. [Full list ›](https://mukul47.github.io/react-formloom/)

## Validator — `formloom/validator`

A separate entry point: no React, no renderer code, only `zod`. Re-check submissions against the same schema the builder produced.

```ts
import { schemaToZod } from "formloom/validator";

const result = schemaToZod(formSchema).safeParse(req.body.data);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten().fieldErrors });
}
```

| Option | Default | Purpose |
|---|---|---|
| `enforceRequired` | `false` | Reject empty/missing values for `required` fields. |
| `inject` | — | Add or replace validation per field `type` / `meta.widget`. |
| `unknownField` | `"passthrough"` | Unmapped widgets: `"passthrough"` · `"strip"` · `"error"`. |

[Validator docs ›](https://mukul47.github.io/react-formloom/) · runnable server example in [`examples/backend/`](examples/backend/)

## License

[MIT](LICENSE) © Mukul Dutt
