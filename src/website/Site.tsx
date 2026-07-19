import { useEffect, useMemo, useState } from "react";
import {
  ReactCustomFormBuilder,
  ReactCustomFormBuilderDialog,
  FormRenderer,
  AttachmentsProvider,
  withAllFields,
  type FormSchema,
} from "@/components/react-custom-form-builder";
// Registers the demo widget field types (domain/rating/country) + color field.
import "@/demo/formloom-setup";
import { CodeBlock } from "./CodeBlock";
import {
  GALLERY_SCHEMA, VALIDATION_SCHEMA, HOOKS_SCHEMA, SIDE_EFFECT_SCHEMA,
  SECTION_SCHEMA, TABS_SCHEMA, COLUMNS_SCHEMA, ARRAY_SCHEMA, NESTED_ARRAY_SCHEMA, DIVIDER_SCHEMA,
  DOMAIN_SCHEMA, RATING_SCHEMA, COUNTRY_SCHEMA,
  DYNAMIC_PROPS_SCHEMA, CUSTOM_FIELD_SCHEMA,
  FILE_SCHEMA, PRELOAD_SCHEMA, GLOBAL_PRELOAD_SCHEMA, GLOBAL_SUBMIT_SCHEMA,
} from "./schemas";

/** Make File objects readable in the payload panel (they JSON-stringify to {}). */
function readablePayload(values: Record<string, unknown>) {
  const fileInfo = (f: File) => ({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, type: f.type || "—" });
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (Array.isArray(v) && v.some((x) => x instanceof File)) out[k] = v.map((f) => (f instanceof File ? fileInfo(f) : f));
    else if (v instanceof File) out[k] = fileInfo(v);
    else out[k] = v;
  }
  return out;
}
import {
  Blocks, Boxes, FileUp, Code, ListChecks, Moon, Puzzle,
  Rocket, Server, Sparkles, Sun, TerminalSquare, Wand2, LayoutGrid, PencilRuler, RotateCcw, ArrowRight,
  Braces, GitCompare, Lock, Unplug, Plug, Feather,
} from "lucide-react";

const PKG = "formloom";

const NAV: { group: string; items: { id: string; label: string; icon: any; children?: { id: string; label: string }[] }[] }[] = [
  { group: "Getting started", items: [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "install", label: "Install", icon: TerminalSquare },
    { id: "quickstart", label: "Quick start", icon: Rocket },
    { id: "playground", label: "Playground", icon: Blocks },
  ]},
  { group: "Fields & validation", items: [
    { id: "fields", label: "Field types", icon: LayoutGrid },
    { id: "validation", label: "Validation", icon: ListChecks },
  ]},
  { group: "Logic", items: [
    { id: "hooks", label: "Hooks", icon: Wand2, children: [
      { id: "hk-preload", label: "beforePreload" },
      { id: "hk-submit-validate", label: "beforeSubmit" },
      { id: "hk-submit-validate", label: "validate" },
      { id: "hk-sideeffect", label: "sideEffect" },
      { id: "hk-gpreload", label: "global beforePreload" },
      { id: "hk-gsubmit-validate", label: "global validate" },
      { id: "hk-gsubmit-validate", label: "global beforeSubmit" },
    ] },
  ]},
  { group: "Layout", items: [
    { id: "l-section", label: "Section", icon: Boxes },
    { id: "l-tabs", label: "Tabs", icon: Boxes },
    { id: "l-columns", label: "Columns", icon: Boxes },
    { id: "l-array", label: "Array (repeater)", icon: Boxes },
    { id: "l-divider", label: "Divider", icon: Boxes },
  ]},
  { group: "Extend", items: [
    { id: "widgets", label: "Widgets", icon: Puzzle },
    { id: "custom-fields", label: "Custom fields", icon: PencilRuler },
    { id: "files", label: "File uploads", icon: FileUp },
    { id: "backend", label: "Backend validation", icon: Server },
  ]},
  { group: "Reference", items: [
    { id: "builder-variants", label: "Builder variants", icon: Blocks },
    { id: "theming", label: "Theming & dark mode", icon: Sun },
    { id: "reference", label: "Props & schema", icon: Braces },
  ]},
];

function Section({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border/60 py-14">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary/70">{eyebrow}</p>}
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-foreground">
        {children}
      </div>
    </section>
  );
}

/** "Open in builder" — pops the real builder; Save propagates edits back. */
function OpenInBuilder({ schema, onSave }: { schema: FormSchema; onSave?: (s: FormSchema) => void }) {
  return (
    <ReactCustomFormBuilderDialog
      mode="builder"
      initialSchema={schema}
      onSave={onSave}
      title="This example, in the builder"
      description="Drag fields, edit properties, wire hooks — then Save to apply your changes to the live demo."
      trigger={
        <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-muted">
          <Blocks className="h-3.5 w-3.5" /> Open in builder
        </button>
      }
    />
  );
}

/** A live example: renders the schema, shows the submitted JSON. Editing it in the
 *  builder (Open in builder → Save) updates THIS demo on the fly; Reset reverts. */
function LiveForm({ schema: initialSchema, label = "Submit", initialValues, outputLabel = "Submitted payload", note, hint }:
  { schema: FormSchema; label?: string; initialValues?: Record<string, unknown>; outputLabel?: string; note?: string; hint?: React.ReactNode }) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema);
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const edited = schema !== initialSchema;
  // Remount the renderer when the field set changes so it picks up edits cleanly.
  const renderKey = useMemo(() => JSON.stringify(schema.fields.map((f) => [f.id, f.type, f.name])), [schema]);
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live example{edited && <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">edited</span>}
        </span>
        <div className="flex items-center gap-2">
          {edited && (
            <button
              type="button"
              onClick={() => { setSchema(initialSchema); setValues(null); }}
              title="Revert to the original example schema"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Revert
            </button>
          )}
          <OpenInBuilder schema={schema} onSave={(s) => { setSchema(s); setValues(null); }} />
        </div>
      </div>
      {hint && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground [&_strong]:text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-foreground">
          <Blocks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p>{hint}</p>
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <FormRenderer
            key={renderKey}
            schema={schema}
            initialValues={initialValues}
            submitLabel={label}
            onSubmit={(v) => { console.log("onSubmit →", v); setValues(v); }}
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{outputLabel}</p>
          {values ? (
            <pre className="overflow-x-auto text-[12px] font-mono text-foreground">{JSON.stringify(readablePayload(values), null, 2)}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">{note ?? <>Fill in the form and hit <strong>{label}</strong> — the exact object your <code>onSubmit</code> receives shows here (also logged to the console). Or hit <strong>Open in builder</strong>, edit, and Save to change this form on the fly.</>}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const FIELD_TYPES = [
  ["Input", "input · textarea · number · email · phone · url · password · slider"],
  ["Selection", "select · multiSelect · radio · checkbox · switch"],
  ["Date / time", "datePicker · timePicker · dateRange"],
  ["File", "file"],
  ["Layout", "section · tabs · columns · array · divider"],
  ["Display", "heading · paragraph · hidden"],
];

export function Site() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState("overview");
  const [saved, setSaved] = useState<FormSchema | null>(null);
  const [live, setLive] = useState<FormSchema | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const ids = NAV.flatMap((g) => g.items.map((i) => i.id));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const previewSchema = live ?? saved;
  const backendJson = useMemo(() => JSON.stringify(withAllFields(previewSchema ?? VALIDATION_SCHEMA), null, 2), [previewSchema]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><Blocks className="h-4 w-4" /></span>
          <span className="font-bold tracking-tight">{PKG}</span>
          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">v1.0.0</span>
        </div>
        <div className="flex items-center gap-1">
          <a href={`https://www.npmjs.com/package/${PKG}`} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">npm</a>
          <a href="https://github.com/MUKUL47/reactcustomformbuilder" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="GitHub"><Code className="h-4 w-4" /></a>
          <button onClick={() => setDark((d) => !d)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-10 px-6">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 lg:block">
          <nav className="space-y-6">
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g.group}</p>
                <ul className="space-y-0.5">
                  {g.items.map((i) => (
                    <li key={i.id}>
                      <a href={`#${i.id}`} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${active === i.id ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                        <i.icon className="h-3.5 w-3.5" /> {i.label}
                      </a>
                      {i.children && active === i.id && (
                        <ul className="my-0.5 ml-4 space-y-0.5 border-l border-border pl-2">
                          {i.children.map((c, idx) => (
                            <li key={`${c.id}-${idx}`}>
                              <a href={`#${c.id}`} className="block rounded px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">
                                {c.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24">
          {/* Hero */}
          <div className="py-16">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Framework-agnostic · React 18 & 19
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Build forms visually. <span className="text-primary">Render them anywhere.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              A drag-and-drop form <strong className="text-foreground">builder</strong> + runtime <strong className="text-foreground">renderer</strong> for React.
              Plain-JSON schema, 24 field types, hooks, reactive side effects, validation, data sources, widgets and file uploads.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#quickstart" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">Get started</a>
              <a href="#playground" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Open playground</a>
              <code className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">npm i {PKG}</code>
            </div>
          </div>

          <Section id="overview" eyebrow="Overview" title="What it is">
            <p><strong>{PKG}</strong> is two components sharing one schema. The <strong>builder</strong> lets people design a form by dragging fields onto a canvas; it emits a plain-JSON <code>FormSchema</code>. The <strong>renderer</strong> takes that schema and runs a real, validated form — with hooks, reactive side effects, containers and file handling.</p>
            <p>No vendor coupling. The schema is <strong>plain data</strong> — store it in a DB column, diff it, version it, generate it with an LLM. Everything app-specific — custom inputs, async lookups, per-field logic — plugs in through small registries and JS-function hooks, so the core stays generic while your app stays in control.</p>
            <p>And the exact same schema validates on <strong>both ends</strong>: the renderer checks it in the browser, and the standalone <code>{PKG}/validator</code> re-checks it on your server. One source of truth, zero drift.</p>

            <p className="!mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {([
                [Braces, "Plain-JSON schema", "Portable data — store it, diff it, version it, or generate it with an LLM. No proprietary format, no runtime coupling."],
                [GitCompare, "One schema, zero drift", "The exact same rules validate in the browser and on your server, from a single source of truth."],
                [Lock, "Sandboxed hooks", "Untrusted or AI-generated hook code runs in a Web Worker — no DOM, no fetch, hard 3-second timeout."],
                [Unplug, "No vendor coupling", "No state library or context to buy into. Drop it into any React 18 / 19 app."],
                [Plug, "Pluggable everything", "Fields, widgets and per-field logic all extend through small registries + JS-function hooks."],
                [Feather, "Self-contained", "Tree-shakeable ESM; the standalone validator carries zero React weight on the server."],
              ] as const).map(([Icon, t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="font-semibold text-foreground">{t}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="!mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore — jump to a live example</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([
                [LayoutGrid, "24 field types", "Inputs, selection, date/time, file, layout, display.", "#fields"],
                [Wand2, "7 hooks", "Per-field & global: preload, submit, validate, side effects.", "#hooks"],
                [Sparkles, "Reactive side effects", "Hide, disable and override other fields on the fly.", "#hk-sideeffect"],
                [ListChecks, "14 validation rules", "Built-in rules + custom validate hooks, inline errors.", "#validation"],
                [Boxes, "Layout containers", "Sections, tabs, columns and nestable arrays.", "#l-section"],
                [Puzzle, "Widgets", "Drop in your own components, configured by dynamic props.", "#widgets"],
                [PencilRuler, "Custom field types", "First-class palette fields via registerField().", "#custom-fields"],
                [FileUp, "File uploads", "Native File[], upload limits, edit-mode attachments.", "#files"],
                [Server, "Backend validation", "Standalone Zod validator — same rules, client + server.", "#backend"],
              ] as const).map(([Icon, t, d, href]) => (
                <a
                  key={t}
                  href={href}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </a>
              ))}
            </div>
          </Section>

          <Section id="install" eyebrow="Setup" title="Install & style">
            <p>Install the package and its React peers:</p>
            <CodeBlock lang="bash" code={`npm install ${PKG}\n# peers: react, react-dom (>=18)`} />
            <p>Then bring in styling — either the prebuilt stylesheet (zero config) …</p>
            <CodeBlock lang="ts" code={`import "${PKG}/styles.css";`} />
            <p>… or, if you already use Tailwind, extend it with the shipped preset:</p>
            <CodeBlock lang="js" code={`// tailwind.config.js\nmodule.exports = {\n  presets: [require("${PKG}/tailwind-preset")],\n  content: [\n    "./src/**/*.{ts,tsx}",\n    "./node_modules/${PKG}/dist/**/*.js",\n  ],\n};`} />
            <p>Dark mode is class-based — toggle <code>class="dark"</code> on a parent (this page's ☀️/🌙 button does exactly that).</p>
          </Section>

          <Section id="quickstart" eyebrow="Quick start" title="Builder → schema → renderer">
            <p>Wire the builder's <code>onSave</code> to state, then feed that schema straight into the renderer:</p>
            <CodeBlock code={`import { useState } from "react";\nimport { ReactCustomFormBuilder, FormRenderer, type FormSchema } from "${PKG}";\nimport "${PKG}/styles.css";\n\nexport function App() {\n  const [schema, setSchema] = useState<FormSchema | null>(null);\n\n  return (\n    <>\n      <ReactCustomFormBuilder onSave={setSchema} />\n      {schema && (\n        <FormRenderer schema={schema} onSubmit={(values) => console.log(values)} />\n      )}\n    </>\n  );\n}`} />
            <p>Rendering a stored schema on its own is just the second half:</p>
            <CodeBlock code={`import { FormRenderer, type FormSchema } from "${PKG}";\n\nexport function ContactForm({ schema }: { schema: FormSchema }) {\n  return (\n    <FormRenderer\n      schema={schema}\n      initialValues={{ email: "hi@example.com" }}\n      onSubmit={async (values) => { await api.submit(values); }}\n    />\n  );\n}`} />
          </Section>

          <Section id="playground" eyebrow="Interactive" title="Playground">
            <p>The real builder, live. Drag fields from the palette, edit their properties, wire hooks — the <strong>preview updates as you build</strong> (no need to save). Everything you make here also flows into the Backend section below.</p>
            <div className="overflow-hidden rounded-xl border border-border shadow-sm" style={{ height: 640 }}>
              <ReactCustomFormBuilder
                onSave={setSaved}
                onChange={setLive}
                theme={dark ? "dark" : "light"}
                className="h-full"
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview of what you're building</p>
              {previewSchema && previewSchema.fields.length ? (
                <LivePreview schema={previewSchema} />
              ) : (
                <p className="text-sm text-muted-foreground">Drag a field into the canvas above — it renders here instantly.</p>
              )}
            </div>
          </Section>

          <Section id="fields" eyebrow="Fields" title="24 field types">
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {FIELD_TYPES.map(([cat, list], i) => (
                    <tr key={cat} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="w-32 border-r border-border px-4 py-2.5 font-semibold text-foreground">{cat}</td>
                      <td className="px-4 py-2.5 font-mono text-[13px]">{list}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Every type is live below. <code>divider/heading/paragraph</code> are stripped from the payload; <code>hidden</code> stays; <code>section/tabs</code> flatten their children.</p>
            <LiveForm schema={GALLERY_SCHEMA} />
          </Section>

          <Section id="validation" eyebrow="Validation" title="14 built-in rules">
            <p>Attach rules to <code>field.validation</code>. Errors appear inline after a field is touched, and the whole form validates on submit — focusing the first invalid field. Try submitting empty:</p>
            <LiveForm schema={VALIDATION_SCHEMA} />
            <p>A complete field with a regex rule:</p>
            <CodeBlock lang="ts" code={`const field: FieldSchema = {\n  id: "pin",\n  name: "pin",\n  type: "input",\n  label: "PIN code",\n  required: true,\n  validation: [\n    { type: "pattern", value: "^\\\\d{6}$", message: "Exactly 6 digits" },\n  ],\n};`} />
            <p><code>required · minLength · maxLength · min · max · pattern · email · url · numeric · alphanumeric · fileMaxSize · fileTypes · fileMinCount · fileMaxCount</code></p>
          </Section>

          <Section id="hooks" eyebrow="Logic" title="Hooks — all 7, live">
            <p><strong>7 hooks</strong> in total: <strong>4 per-field</strong> (<code>beforePreload</code>, <code>beforeSubmit</code>, <code>validate</code>, <code>sideEffect</code>) and <strong>3 global</strong> on <code>schema.globalHooks</code> (<code>beforePreload</code>, <code>validate</code>, <code>beforeSubmit</code>). No code below — every one is a live example. To read or edit a hook, hit <strong>Open in builder</strong>:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Global hooks</strong> → click the <code>Before Preload</code> / <code>Custom Validation</code> / <code>Before Submit</code> chip at the <strong>top</strong> of the builder.</li>
              <li><strong>Per-field hooks</strong> → <strong>select the field</strong> on the canvas, then scroll to the <strong>bottom of the property panel</strong> (right side) — the hook editors are there.</li>
            </ul>

            <h3 className="pt-3 text-base font-bold text-primary">Per-field hooks (4)</h3>

            <h4 id="hk-preload" className="scroll-mt-20 pt-1 text-sm font-semibold text-foreground">1 · beforePreload — normalize the initial value on load</h4>
            <p>The invoice is preloaded as <code>"inv 2026 07"</code> but shows up-cased + dashed — <code>beforePreload</code> transformed it before render.</p>
            <LiveForm schema={PRELOAD_SCHEMA} initialValues={{ invoice: "inv 2026 07" }}
              note="Preloaded — the value shown was already transformed by beforePreload."
              hint={<>Select the <strong>Invoice</strong> field → property panel (right) → scroll to the bottom → <strong>Before Preload</strong>.</>} />

            <h4 id="hk-submit-validate" className="scroll-mt-20 pt-1 text-sm font-semibold text-foreground">2 · beforeSubmit &amp; 3 · validate — transform, then guard on submit</h4>
            <p>The email is trimmed + lowercased by <code>beforeSubmit</code> (see the payload); <code>validate</code> blocks submit unless confirm-password matches.</p>
            <LiveForm schema={HOOKS_SCHEMA}
              hint={<>Select a field → property panel, scroll to the bottom → <strong>Before Submit</strong> / <strong>Custom Validation</strong>.</>} />

            <h4 id="hk-sideeffect" className="scroll-mt-20 pt-1 text-sm font-semibold text-foreground">4 · sideEffect — reactively reshape the rest of the form</h4>
            <p>Runs on <strong>every</strong> value change and returns <code>{`{ hide?: string[], disable?: string[], override?: { [name]: value } }`}</code> — three levers at once:</p>
            <ul className="ml-5 list-disc space-y-0.5">
              <li><strong>hide</strong> — remove fields from view <em>and</em> from the submitted payload.</li>
              <li><strong>disable</strong> — grey a field out but keep its value.</li>
              <li><strong>override</strong> — force another field's value.</li>
            </ul>
            <p>The example below drives all three: pick <strong>Personal</strong> and the company fields <em>hide</em>, invoice email is <em>disabled</em>, and <code>plan</code> is <em>overridden</em> to <code>free</code>; switch to <strong>Business</strong> and they reappear with <code>plan → team</code>:</p>
            <LiveForm schema={SIDE_EFFECT_SCHEMA}
              hint={<>Select the <strong>Account type</strong> field → property panel, scroll to the bottom → <strong>Side Effect</strong>.</>} />
            <div className="rounded-lg border border-amber-300/40 bg-amber-50/40 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="font-semibold text-foreground">⚠️ Side effects are powerful — use them carefully</p>
              <p className="mt-1 text-muted-foreground">A <code>sideEffect</code> recomputes on <strong>every</strong> change and can drive other fields, so it's easy to create cascades and deadlocks:</p>
              <ul className="mt-1.5 ml-5 list-disc space-y-1 text-muted-foreground">
                <li><strong>Hidden required fields don't block submit.</strong> A field hidden by a side effect is stripped from the payload, so it is <em>excluded from validation</em> — otherwise a hidden <code>required</code> field would deadlock submit and try to focus an invisible field. (That's handled for you; don't rely on validating hidden fields.)</li>
                <li><strong>Avoid feedback loops.</strong> If A <code>override</code>s B and B's side effect <code>override</code>s A, they can ping-pong forever. Make overrides idempotent — only set a value that actually changed.</li>
                <li><strong>Keep them pure &amp; cheap.</strong> Side effects run constantly; no fetches, no timers, no randomness — derive the result from the inputs only.</li>
              </ul>
            </div>

            <h3 className="pt-4 text-base font-bold text-primary">Global hooks (3)</h3>

            <h4 id="hk-gpreload" className="scroll-mt-20 pt-1 text-sm font-semibold text-foreground">5 · global beforePreload — derive a field from others on load</h4>
            <p>Preloaded with <code>{`{ first: "ada", last: "lovelace" }`}</code> — global <code>beforePreload</code> fills <code>fullName</code> = <strong>"Ada Lovelace"</strong>.</p>
            <LiveForm schema={GLOBAL_PRELOAD_SCHEMA} initialValues={{ first: "ada", last: "lovelace" }}
              note="Full name was computed on load from the other two fields by a global beforePreload hook."
              hint={<>Click the <strong>Before Preload</strong> chip at the top of the builder.</>} />

            <h4 id="hk-gsubmit-validate" className="scroll-mt-20 pt-1 text-sm font-semibold text-foreground">6 · global validate &amp; 7 · global beforeSubmit — cross-field rule, then reshape</h4>
            <p>Global <code>validate</code> blocks if end is before start (form-level error); on success global <code>beforeSubmit</code> adds a computed <code>range</code>. Pick an end date before the start to see it blocked.</p>
            <LiveForm schema={GLOBAL_SUBMIT_SCHEMA}
              hint={<>Click the <strong>Custom Validation</strong> and <strong>Before Submit</strong> chips at the top.</>} />

            <p className="pt-2">Every hook body is a <strong>named function declaration</strong> matching the hook name (per-field: <code>(value, fieldName, allValues)</code>; global: <code>(values)</code>). Untrusted / AI-generated hook code can run in a Web-Worker sandbox (no DOM/fetch/window, ~3s timeout) via the exported <code>runValidateHooksAsync</code> / <code>safeExecuteHook</code> helpers.</p>
          </Section>

          <Section id="l-section" eyebrow="Layout" title="Section — collapsible group">
            <p>A <code>section</code> groups fields under a collapsible header. It's rendering-only: children are authored nested but <strong>flatten to the top level on submit</strong> — <code>street</code>, <code>city</code>, <code>zip</code> land flat, not under <code>billing</code>. Validation, hooks and side effects all recurse into it.</p>
            <LiveForm schema={SECTION_SCHEMA} />
          </Section>

          <Section id="l-tabs" eyebrow="Layout" title="Tabs — multi-tab group">
            <p><code>tabs</code> splits fields across tabs. Children <strong>flatten on submit</strong> too. Tab labels show an error dot and auto-activate when they contain an invalid field — submit empty to see it jump to the offending tab.</p>
            <LiveForm schema={TABS_SCHEMA} />
          </Section>

          <Section id="l-columns" eyebrow="Layout" title="Columns — side-by-side layout">
            <p><code>columns</code> lays its children out in a responsive grid (<code>props.columns</code> = 2/3/4). Purely visual — children flatten on submit like any container. Below: a 2-column name row and a 3-column location row.</p>
            <LiveForm schema={COLUMNS_SCHEMA} />
          </Section>

          <Section id="l-array" eyebrow="Layout" title="Array — repeatable rows">
            <p>An <code>array</code> repeats a set of <strong>template fields</strong> as rows the user can add/remove (<code>props.minRows</code>, <code>props.maxRows</code>, <code>props.addLabel</code>). Unlike other containers, its value is a real nested array — <code>lineItems: [{`{ item, qty }`}, …]</code>.</p>
            <LiveForm schema={ARRAY_SCHEMA} label="Submit" />

            <h3 className="pt-4 text-base font-bold text-primary">Nested arrays</h3>
            <p>An array's template can contain <strong>another array</strong> — here each <em>department</em> row holds its own <em>members</em> repeater. The value nests all the way down: <code>departments: [{`{ deptName, members: [{ memberName, role }] }`}]</code>. Add a department, then add members inside it, and submit:</p>
            <LiveForm schema={NESTED_ARRAY_SCHEMA} label="Submit" />

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Validation keys: field names must be unique across the whole form</p>
              <p className="mt-1 text-muted-foreground">Errors are tracked by a unique <strong>path key</strong>. Inside an array, each row is disambiguated by its index — a failing cell resolves to <code>{`arrayName.rowIndex.childName`}</code> (e.g. <code>departments.0.members.1.role</code>), so the renderer highlights the exact row that's invalid. That only works if every field's <code>name</code> is <strong>unique throughout the entire form</strong>: containers flatten on submit and both the payload and the error map are keyed by name, so two fields sharing a name would collide — the wrong one gets the value and the wrong one gets focused. Template-field names inside an array only need to be unique <em>within that array</em> (the row index keeps rows apart), but array field names themselves, and every non-array field name, must be globally unique.</p>
            </div>

            <div className="rounded-lg border border-amber-300/40 bg-amber-50/40 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="font-semibold text-foreground">⚠️ Hooks don't run inside arrays</p>
              <p className="mt-1 text-muted-foreground">Per-field <em>and</em> nested hooks won't fire for fields inside an array (or an array-within-an-array) — they run once per schema, not per row. For any per-row or nested transform, use <strong>global hooks</strong> (<code>beforePreload</code> / <code>beforeSubmit</code> / <code>validate</code>) on <code>schema.globalHooks</code>, which receive the whole values object and can walk the nested arrays themselves.</p>
            </div>
          </Section>

          <Section id="l-divider" eyebrow="Layout" title="Divider — visual separator">
            <p>A <code>divider</code> draws a horizontal rule between fields. It carries no data and is <strong>stripped from the submitted payload</strong> (like <code>heading</code> and <code>paragraph</code>).</p>
            <LiveForm schema={DIVIDER_SCHEMA} />
          </Section>

          {/* ── Widgets ── */}
          <Section id="widgets" eyebrow="Extend" title="Widgets — palette fields you own">
            <p>A <strong>widget is a field registered with <code>category: "widget"</code></strong>. It shows up in the palette's <strong>Widgets</strong> group (bottom-left), drags onto the canvas like any built-in, renders your component, and is configured by its own <code>propertyFields</code> — read at runtime off <code>field.props</code>. No meta, no dropdowns. It's how you'd ship things like a user picker, a branch picker, or a calendar as first-class palette items.</p>
            <p>Hit <em>Open in builder</em> on any demo: the widget is in the palette bottom-left, sits on the canvas, and its props edit in the property panel.</p>

            {/* domain */}
            <h3 className="pt-3 text-base font-bold text-primary">1 · Custom domain — <code>props.suffix</code></h3>
            <LiveForm schema={DOMAIN_SCHEMA} hint={<>Open in builder → palette <strong>Widgets</strong> group (bottom-left) → <em>Custom Domain</em>. Select it on the canvas → edit <strong>Domain suffix</strong> in the property panel.</>} />
            <CodeBlock code={`import { registerField, type RuntimeFieldProps } from "${PKG}";\nimport { Globe } from "lucide-react";\n\nfunction DomainRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {\n  const suffix = (field.props?.suffix as string) ?? ".forms.app"; // ← dynamic prop\n  return (\n    <div className="flex rounded-md border">\n      <input className="flex-1 px-3 py-2 outline-none" value={String(value ?? "")} disabled={disabled}\n        placeholder="your-company" onChange={(e) => onChange(e.target.value)} />\n      <span className="flex items-center bg-muted px-3 text-muted-foreground">{suffix}</span>\n    </div>\n  );\n}\n\n// A widget = a field with category "widget" → appears in the palette.\nregisterField({\n  type: "domain",\n  label: "Custom Domain",\n  icon: Globe,\n  category: "widget",\n  defaultSchema: { props: { suffix: ".forms.app" } },\n  CanvasComponent: ({ field }) => <span>your-company{field.props?.suffix ?? ".forms.app"}</span>,\n  RuntimeComponent: DomainRuntime,\n  propertyFields: [\n    { key: "label", label: "Label", type: "text" },\n    { key: "name", label: "Field Name", type: "text" },\n    { key: "props.suffix", label: "Domain suffix", type: "text" }, // edits field.props.suffix\n  ],\n});`} />

            {/* rating */}
            <h3 className="pt-4 text-base font-bold text-primary">2 · Rating — <code>props.max</code> + <code>props.icon</code></h3>
            <LiveForm schema={RATING_SCHEMA} hint={<>Open in builder → select the rating field → change <strong>Max icons</strong> and <strong>Icon</strong> (star/heart) in the property panel.</>} />
            <CodeBlock code={`import { registerField, type RuntimeFieldProps } from "${PKG}";\nimport { Star, Heart } from "lucide-react";\n\nfunction RatingRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {\n  const max  = (field.props?.max as number) ?? 5;\n  const Icon = field.props?.icon === "heart" ? Heart : Star; // ← dynamic props\n  const current = (value as number) ?? 0;\n  return (\n    <div className="flex gap-1">\n      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (\n        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)}>\n          <Icon fill={n <= current ? "currentColor" : "none"} />\n        </button>\n      ))}\n    </div>\n  );\n}\n\nregisterField({\n  type: "rating",\n  label: "Rating",\n  icon: Star,\n  category: "widget",\n  defaultSchema: { defaultValue: 0, props: { max: 5, icon: "star" } },\n  CanvasComponent: ({ field }) => <span>{"☆".repeat((field.props?.max as number) ?? 5)}</span>,\n  RuntimeComponent: RatingRuntime,\n  propertyFields: [\n    { key: "label", label: "Label", type: "text" },\n    { key: "name", label: "Field Name", type: "text" },\n    { key: "props.max", label: "Max icons", type: "number" },\n    { key: "props.icon", label: "Icon", type: "select",\n      selectOptions: [{ label: "Star", value: "star" }, { label: "Heart", value: "heart" }] },\n  ],\n});`} />

            {/* country */}
            <h3 className="pt-4 text-base font-bold text-primary">3 · Country picker — async + <code>props.multiple</code> / <code>props.showFlags</code></h3>
            <LiveForm schema={COUNTRY_SCHEMA} hint={<>Open in builder → select the country field → toggle <strong>Allow multiple</strong> and <strong>Show flags</strong> in the property panel.</>} />
            <CodeBlock code={`import { registerField, type RuntimeFieldProps } from "${PKG}";\nimport { useEffect, useRef, useState } from "react";\n\nfunction CountryRuntime({ field, value, onChange, disabled }: RuntimeFieldProps) {\n  const multiple  = field.props?.multiple === true;    // single vs multi\n  const showFlags = field.props?.showFlags !== false;  // toggle a capability\n\n  const [query, setQuery] = useState("");\n  const [results, setResults] = useState<Country[]>([]);\n  const debounce = useRef<ReturnType<typeof setTimeout>>();\n\n  useEffect(() => {                       // debounced async fetch\n    clearTimeout(debounce.current);\n    debounce.current = setTimeout(async () => {\n      setResults(await fetch(\`/api/countries?q=\${query}\`).then((r) => r.json()));\n    }, 250);\n    return () => clearTimeout(debounce.current);\n  }, [query]);\n\n  const selected = multiple ? ((value as string[]) ?? []) : value ? [value] : [];\n  const pick = (code: string) => multiple\n    ? onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code])\n    : onChange(code);\n\n  return (/* search box + dropdown; render flag emoji when showFlags */);\n}\n\nregisterField({\n  type: "country",\n  label: "Country Picker",\n  icon: MapPin,\n  category: "widget",\n  defaultSchema: { props: { multiple: false, showFlags: true } },\n  CanvasComponent: () => <span>🔎 Search countries…</span>,\n  RuntimeComponent: CountryRuntime,\n  propertyFields: [\n    { key: "label", label: "Label", type: "text" },\n    { key: "name", label: "Field Name", type: "text" },\n    { key: "props.multiple",  label: "Allow multiple", type: "boolean" },\n    { key: "props.showFlags", label: "Show flags",     type: "boolean" },\n  ],\n});`} />

            {/* dynamic props */}
            <h3 className="pt-4 text-base font-bold text-primary">Dynamic props — one widget, configured per field</h3>
            <p>Because behavior comes from <code>field.props</code>, the same widget renders differently on each field. The <strong>rating</strong> widget below is 5 stars vs 3 hearts; the <strong>country</strong> widget is single-select without flags — same components, different props:</p>
            <LiveForm schema={DYNAMIC_PROPS_SCHEMA} />
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <strong className="text-foreground">RuntimeFieldProps</strong> — <code>{`{ field, value, onChange, error?, disabled?, allErrors?, sideEffects? }`}</code>. Register each widget once at boot from a side-effect module (e.g. <code>formloom-setup.tsx</code>) imported in your entry, before the builder/renderer mount.
            </div>
          </Section>

          {/* ── Custom fields ── */}
          <Section id="custom-fields" eyebrow="Extend" title="Custom field types">
            <p>A custom field type is registered exactly like a widget — one <code>registerField()</code> call with a canvas preview, a runtime input, and property editors. The <strong>only difference is <code>category</code></strong>, which decides where it lands in the palette:</p>
            <ul className="ml-5 list-disc space-y-0.5">
              <li><code>input</code> → <strong>Input Fields</strong> · <code>selection</code> → <strong>Selection Fields</strong> · <code>layout</code> → <strong>Layout</strong> · <code>display</code> → <strong>Display</strong> · <code>widget</code> → <strong>Widgets</strong></li>
            </ul>
            <p>So the widgets in the previous section are just <code>registerField</code> with <code>category: "widget"</code>. The <code>color</code> field below uses <code>category: "input"</code>, so it shows up in the palette's <strong>Input Fields</strong> group — a native color picker sitting right alongside Text Input and Email:</p>
            <CodeBlock code={`import { registerField, type FieldDefinition } from "${PKG}";\nimport { Palette } from "lucide-react";\n\nconst colorField: FieldDefinition = {\n  type: "color" as any,        // FieldType is a fixed union — cast to extend it\n  label: "Color",\n  icon: Palette,               // shown in the palette\n  category: "input",           // → lands in the "Input Fields" palette group\n  defaultSchema: { defaultValue: "#4f46e5" },\n  CanvasComponent: ({ field }) => <span>{field.label}</span>,        // builder preview\n  RuntimeComponent: ({ value, onChange, disabled }) => (            // the real input\n    <input type="color" value={(value as string) ?? "#4f46e5"} disabled={disabled}\n      onChange={(e) => onChange(e.target.value)} />\n  ),\n  propertyFields: [\n    { key: "label", label: "Label", type: "text" },\n    { key: "name", label: "Field Name", type: "text" },\n    { key: "defaultValue", label: "Default color", type: "text" },\n  ],\n};\n\nregisterField(colorField); // import this file once at boot`} />
            <p>The <strong>Brand color</strong> field below is this custom <code>color</code> type. Hit <em>Open in builder</em> and look under <strong>Input Fields</strong> — it's a draggable palette item like any built-in:</p>
            <LiveForm schema={CUSTOM_FIELD_SCHEMA} />
          </Section>

          <Section id="files" eyebrow="Extend" title="File uploads">
            <p>The <code>file</code> field stores native <code>File[]</code> and enforces <code>accept</code>/<code>maxSizeMB</code>/<code>maxCount</code> at selection time (with a rejection banner). On submit your <code>onSubmit</code> receives the real <code>File</code> objects. Pick a few files below and submit — the output panel shows exactly what came through (name, size, type), and it's <code>console.log</code>-ed too:</p>
            <LiveForm schema={FILE_SCHEMA} outputLabel="onSubmit output (console)" note="Choose files and submit — each File's name / size / type appears here and in the browser console." />
            <p>The picked <code>File</code>s map straight into a <code>FormData</code> for a multipart request — the browser sets the multipart boundary on its own when <code>Content-Type</code> is left unset:</p>
            <CodeBlock code={`function toFormData(values: Record<string, unknown>) {\n  const fd = new FormData();\n  for (const [key, val] of Object.entries(values)) {\n    if (Array.isArray(val) && val[0] instanceof File) {\n      val.forEach((file) => fd.append(key, file, file.name));\n    } else if (val instanceof File) {\n      fd.append(key, val, val.name);\n    } else {\n      fd.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));\n    }\n  }\n  return fd;\n}\n\n<FormRenderer schema={schema} onSubmit={(values) =>\n  fetch("/api/submit", { method: "POST", body: toFormData(values) })\n} />`} />

            <h3 className="pt-3 text-base font-bold text-primary">Feeding files back into the form (edit mode)</h3>
            <p>Once files are uploaded they live on your server, not as <code>File</code> objects — so you can't just pass them through <code>initialValues</code>. Instead wrap the renderer in an <code>AttachmentsProvider</code> and hand it the already-uploaded files per field name. The <code>file</code> field then shows them (with download / delete) above any newly picked ones, and they count toward <code>maxCount</code>. The example below is preloaded with two existing files:</p>
            <FileEditExample />
            <CodeBlock code={`import { useEffect, useState } from "react";
import {
  AttachmentsProvider,
  FormRenderer,
  type FormSchema,
  type ExistingAttachment,
} from "${PKG}";

// The schema is user-built, so file-field names aren't known ahead of time —
// nothing below hardcodes them. Existing files are grouped by field name.
type ExistingByField = Record<string, ExistingAttachment[]>;

// Reusable for ANY schema.
function EditForm({ schema, submissionId }: { schema: FormSchema; submissionId: string }) {
  const [existing, setExisting] = useState<ExistingByField>({});

  useEffect(() => {
    fetch(\`/api/submissions/\${submissionId}/files\`).then((r) => r.json()).then(setExisting);
  }, [submissionId]);

  return (
    <AttachmentsProvider
      value={{
        getFor: (fieldName) => existing[fieldName] ?? [],   // any field, generic
        onDownload: (fileId) => window.open(\`/api/files/\${fileId}\`),
        onDelete: (fileId) => fetch(\`/api/files/\${fileId}\`, { method: "DELETE" }),
      }}
    >
      <FormRenderer
        schema={schema}
        onSubmit={(values) => {
          // Split newly-picked File(s) from the rest — both stay generic.
          const body = new FormData();
          const data: Record<string, unknown> = {};
          for (const [name, value] of Object.entries(values)) {
            const files = (Array.isArray(value) ? value : [value]).filter((v) => v instanceof File) as File[];
            if (files.length) files.forEach((f) => body.append(name, f, f.name));
            else data[name] = value;
          }
          body.append("data", JSON.stringify(data));
          fetch(\`/api/submissions/\${submissionId}\`, { method: "PATCH", body });
        }}
      />
    </AttachmentsProvider>
  );
}`} />
            <p>On submit you still receive only the <strong>newly picked</strong> <code>File</code>s; existing files are managed through the provider's <code>onDelete</code>. That keeps the schema clean — the form never has to carry server file blobs.</p>
          </Section>

          <Section id="backend" eyebrow="Extend" title="Backend validation with Zod">
            <p>Client validation is a UX feature, not a security boundary. The same <code>FormSchema</code> validates on <strong>both ends</strong> — the renderer checks it before submit, your server re-checks it on the request — using one standalone translator:</p>
            <CodeBlock lang="ts" code={`client  ─ renderer ─▶ schemaToZod(schema).safeParse(values)\n                             │  (identical rules)\nserver  ─ handler  ─▶ schemaToZod(schema).safeParse(req.body)`} />
            <p><code>formloom/validator</code> is a <strong>separate entry point</strong> — importing it pulls in <strong>no React and no renderer code</strong>, only <code>zod</code> (an optional peer). It's a raw converter: it returns a <code>z.ZodObject</code> and you do the rest.</p>
            <CodeBlock lang="ts" code={`import { schemaToZod } from "${PKG}/validator";\n\nconst validator = schemaToZod(formSchema); // formSchema loaded from your DB\nconst result = validator.safeParse(req.body.data);\n\nif (!result.success) {\n  return res.status(400).json({ errors: result.error.flatten().fieldErrors });\n}\nawait db.insert({ formId, data: result.data }); // cleaned: stray keys stripped`} />
            <p><strong><code>inject</code> — add or replace validation</strong>, keyed by field <code>type</code> or <code>meta.widget</code> name. It runs for <em>any</em> matching field, built-in or widget, and receives <code>(field, base)</code> where <code>base</code> is the Zod type the translator already computed. Return <code>base</code> refined to <strong>tighten an existing field</strong>, or a brand-new schema to <strong>define a widget</strong> from scratch:</p>
            <CodeBlock lang="ts" code={`import { z } from "zod";\n\nschemaToZod(formSchema, {\n  inject: {\n    // TIGHTEN a built-in field — refine the base the translator gave you:\n    email:   (_f, base) => base.endsWith("@acme.com"),\n    // DEFINE a widget from scratch — ignore the base:\n    rating:  () => z.number().int().min(0).max(5),\n    country: (f) => f.props?.multiple ? z.array(z.string()) : z.string(),\n  },\n});`} />
            <p><strong>Unmapped widgets</strong> — a widget or custom <code>registerField</code> type with no <code>inject</code> handler is governed by <code>unknownField</code>: keep the value as-is, drop the key, or fail loudly.</p>
            <CodeBlock lang="ts" code={`schemaToZod(formSchema, {\n  unknownField: "strip", // "passthrough" (default) · "strip" (drop key) · "error" (throw)\n});`} />
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-semibold text-foreground">Validation only — 1:1 with the renderer's declarative checks</p>
              <p className="mt-1 text-muted-foreground">The translator mirrors the exact rules the <code>FormRenderer</code> runs at submit: <code>required</code>, the <code>validation</code> rule array (length, min/max, pattern, email/url/numeric, file rules) and array <code>minRows</code>/<code>maxRows</code>. Empty values (<code>undefined&nbsp;/&nbsp;null&nbsp;/&nbsp;""</code>) skip a non-required field's own rules, just like the renderer. It intentionally does <strong>not</strong> run your <code>validate</code> hooks (arbitrary JS you own — re-run those yourself), and it ignores <code>props.min</code>/<code>props.max</code> spinner bounds because the renderer treats those as UI hints, not validation. Add server-side bounds through a <code>validation</code> rule or <code>inject</code>.</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Why <code>file</code> is validated on its own — never through this route</p>
              <p className="mt-1 text-muted-foreground">A <code>file</code> field resolves to its <strong>persisted reference</strong> here — a URL or id, <code>z.string() | z.string[]</code> — <em>never the bytes</em>. The real upload check (max size, MIME type, magic-byte sniffing, virus scan, storage quota, CDN placement) is a <strong>separate pipeline that runs before</strong> a reference ever reaches this validator, because that pipeline is inherently <strong>domain-specific</strong>: it depends on your storage backend, your limits, and your content policy — none of which live in the form schema. Routing files through the shared schema→Zod validator would drag that app-specific logic into a translator that's meant to stay pure and portable (same code, client and server). So files get their own route by design, and this validator only confirms the reference is present and well-shaped.</p>
            </div>
            <p>Containers flatten (<code>section</code>/<code>columns</code>/<code>tabs</code> children become top-level keys; <code>array</code> stays nested), unknown keys are stripped, display fields are skipped. <code>withAllFields()</code> also attaches a flat field summary to the schema. Here's the backend-ready JSON for whatever you built in the Playground:</p>
            <div className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/30 p-4">
              <pre className="text-[12px] font-mono">{backendJson}</pre>
            </div>
            <p className="text-sm text-muted-foreground">A complete, runnable server example (Express-agnostic) ships in <code>examples/backend</code>; the validator's own test suite lives beside the source and runs with <code>npm run test:validator</code>.</p>
          </Section>

          {/* ── Builder variants ── */}
          <Section id="builder-variants" eyebrow="Reference" title="Builder variants">
            <p>Five entry points, one schema — pick the surface you need:</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["<ReactCustomFormBuilder>", "The full builder (palette + canvas + property panel). Use when people author forms and you persist the result.", "initialSchema, onSave, onChange, saving, extraActions, theme, onThemeChange, className"],
                    ["<ReactCustomFormBuilderWithPreview>", "Builder + a live Preview tab in one. Use when authors want to test the form as they build it.", "initialSchema, onSave, onPreviewSubmit, saving, extraActions"],
                    ["<ReactCustomFormBuilderPreview>", "Render-only preview with a submitted-data panel. Use for a quick standalone demo of a schema.", "schema, initialValues, onSubmit, title, showSubmittedData"],
                    ["<ReactCustomFormBuilderDialog>", "Builder OR preview inside a modal. Use to launch either from a button — no dedicated page.", 'mode ("builder" | "preview"), trigger / triggerLabel, + the matching builder/preview props'],
                    ["<FormRenderer>", "The runtime form — no builder chrome. Use in production to run a saved schema.", "schema, initialValues, onSubmit, readOnly, submitLabel, showReset"],
                  ].map(([c, d, p], i) => (
                    <tr key={c} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2.5 align-top font-mono text-[12.5px] font-medium text-primary">{c}</td>
                      <td className="px-3 py-2.5 align-top">{d}<div className="mt-1 font-mono text-[11px] text-muted-foreground">{p}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>The builder + live preview in one component:</p>
            <CodeBlock code={`import { ReactCustomFormBuilderWithPreview } from "${PKG}";\n\n<ReactCustomFormBuilderWithPreview\n  initialSchema={schema}\n  onSave={(s) => saveToDb(s)}\n  onPreviewSubmit={(values) => console.log(values)}\n/>`} />
          </Section>

          {/* ── Theming ── */}
          <Section id="theming" eyebrow="Reference" title="Theming & dark mode">
            <p>Styling ships two ways — pick one:</p>
            <CodeBlock lang="ts" code={`// A) prebuilt stylesheet — zero config\nimport "${PKG}/styles.css";\n\n// B) or extend your own Tailwind with the preset\n// tailwind.config.js → presets: [require("${PKG}/tailwind-preset")]`} />
            <p><strong>Dark mode is class-based</strong>: toggle <code>class="dark"</code> on a parent (usually <code>&lt;html&gt;</code>). The builder toolbar has a theme button; control it from outside with <code>theme</code> (<code>"light" | "dark" | "system"</code>) and <code>onThemeChange</code>:</p>
            <CodeBlock code={`const [theme, setTheme] = useState<"light" | "dark" | "system">("system");\n\n<ReactCustomFormBuilder theme={theme} onThemeChange={setTheme} onSave={save} />`} />
            <p>Restyle everything by overriding the shadcn-style <strong>CSS variables</strong> (HSL triples). Set them on <code>:root</code> and <code>.dark</code> — the components read them, so one place recolors the whole builder + renderer:</p>
            <CodeBlock lang="css" code={`:root {\n  --primary: 243 75% 58%;            /* accent — buttons, links, focus */\n  --background: 0 0% 100%;\n  --foreground: 240 10% 4%;\n  --border: 240 6% 90%;\n  --radius: 0.5rem;\n}\n.dark {\n  --primary: 243 80% 66%;\n  --background: 240 10% 5%;\n  --foreground: 0 0% 96%;\n  --border: 240 5% 16%;\n}`} />
            <p className="text-sm text-muted-foreground">Full token set: <code>background</code>, <code>foreground</code>, <code>card</code>, <code>popover</code>, <code>primary</code>, <code>secondary</code>, <code>muted</code>, <code>accent</code>, <code>destructive</code> (each with a <code>-foreground</code> pair), <code>border</code>, <code>input</code>, <code>ring</code>, <code>radius</code>.</p>
          </Section>

          {/* ── Sandboxed hooks ── */}
          {/* ── Props & schema reference ── */}
          <Section id="reference" eyebrow="Reference" title="Props & schema">
            <h3 className="text-base font-bold text-primary">&lt;FormRenderer&gt;</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["schema", "FormSchema", "The form definition (required)."],
                    ["initialValues", "Record<string, unknown>", "Pre-fill values; runs beforePreload hooks."],
                    ["onSubmit", "(values) => void", "Fires with the cleaned, flattened, hook-transformed payload."],
                    ["readOnly", "boolean", "Render the form in view-only mode (no submit/reset)."],
                    ["submitLabel", "string", 'Submit button text (default "Submit").'],
                    ["showReset", "boolean", "Show the Reset button (default true)."],
                  ].map(([p, t, d], i) => (
                    <tr key={p} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[12.5px] text-primary">{p}</td>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-base font-bold text-primary">&lt;ReactCustomFormBuilder&gt;</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["initialSchema", "FormSchema", "Schema to load into the canvas."],
                    ["onSave", "(schema) => void", "Fires when the user clicks Save."],
                    ["onChange", "(schema) => void", "Fires on every edit (live)."],
                    ["saving", "boolean", "Show a saving state on the Save button."],
                    ["extraActions", "ReactNode", "Custom buttons in the toolbar."],
                    ["theme", '"light" | "dark" | "system"', 'Control the theme (default "system").'],
                    ["onThemeChange", "(theme) => void", "Fires when the toolbar theme button is toggled."],
                    ["className", "string", "Applied to the builder root (set a height here)."],
                  ].map(([p, t, d], i) => (
                    <tr key={p} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[12.5px] text-primary">{p}</td>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-base font-bold text-primary">&lt;ReactCustomFormBuilderWithPreview&gt;</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["initialSchema", "FormSchema", "Schema to load into the builder."],
                    ["onSave", "(schema) => void", "Fires when the user clicks Save."],
                    ["onPreviewSubmit", "(values) => void", "Fires when the preview form is submitted."],
                    ["saving", "boolean", "Show a saving state on the Save button."],
                    ["extraActions", "ReactNode", "Custom buttons in the toolbar."],
                  ].map(([p, t, d], i) => (
                    <tr key={p} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[12.5px] text-primary">{p}</td>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-base font-bold text-primary">&lt;ReactCustomFormBuilderPreview&gt;</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["schema", "FormSchema", "The form to preview (required)."],
                    ["initialValues", "Record<string, unknown>", "Pre-fill values."],
                    ["onSubmit", "(values) => void", "Fires on submit."],
                    ["title", "string", "Heading shown above the preview."],
                    ["showSubmittedData", "boolean", "Show the submitted-values panel."],
                  ].map(([p, t, d], i) => (
                    <tr key={p} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[12.5px] text-primary">{p}</td>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-base font-bold text-primary">&lt;ReactCustomFormBuilderDialog&gt;</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["mode", '"builder" | "preview"', "Which surface the modal shows (required)."],
                    ["trigger", "ReactNode", "Custom element that opens the dialog."],
                    ["triggerLabel", "string", "Text for the default trigger button."],
                    ["title / description", "string", "Modal header text."],
                    ["…builder props", "initialSchema, onSave, saving", "Passed through in builder mode."],
                    ["…preview props", "schema, initialValues, onSubmit", "Passed through in preview mode."],
                  ].map(([p, t, d], i) => (
                    <tr key={p} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[12.5px] text-primary">{p}</td>
                      <td className="whitespace-nowrap border-r border-border px-3 py-2 align-top font-mono text-[11px] text-muted-foreground">{t}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-base font-bold text-primary">Schema shape</h3>
            <CodeBlock lang="ts" code={`interface FormSchema {\n  version: 1;\n  fields: FieldSchema[];\n  globalHooks?: { beforePreload?: string; validate?: string; beforeSubmit?: string };\n  allFields?: FieldSummary[]; // auto-computed flat summary (withAllFields)\n}\n\ninterface FieldSchema {\n  id: string;\n  name: string;               // key in the payload — must be unique across the form\n  type: FieldType;\n  label: string;\n  placeholder?: string;\n  required?: boolean;\n  defaultValue?: unknown;\n  helpText?: string;\n  tooltip?: string;\n  readOnly?: boolean;\n  validation?: ValidationRule[];\n  options?: { label: string; value: string }[];   // select / radio / multiSelect\n  props?: Record<string, unknown>;                 // per-type config (min, max, accept, columns, …)\n  children?: FieldSchema[];                         // section / columns / array\n  tabs?: { key: string; label: string; fields: FieldSchema[] }[]; // tabs\n  hooks?: { beforePreload?: string; beforeSubmit?: string; validate?: string; sideEffect?: string };\n  meta?: Record<string, unknown>;                  // meta.widget + freeform backend hints\n}`} />
          </Section>

          <footer className="pt-14 text-sm text-muted-foreground">
            <p>MIT © Mukul Dutt · <a className="text-primary hover:underline" href="https://github.com/MUKUL47/reactcustomformbuilder">GitHub</a> · <a className="text-primary hover:underline" href={`https://www.npmjs.com/package/${PKG}`}>npm</a></p>
            <p className="mt-1">Every form on this page is a live {PKG} renderer.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

/** File edit-mode example — existing server files fed in via AttachmentsProvider. */
function FileEditExample() {
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [existing, setExisting] = useState<Record<string, { id: string; name: string; size?: number; mimeType?: string }[]>>({
    resume: [{ id: "a1", name: "cv.pdf", size: 84210, mimeType: "application/pdf" }],
    photos: [{ id: "p1", name: "team.png", size: 21990 }],
  });
  const api = {
    getFor: (fieldName: string) => existing[fieldName] ?? [],
    onDownload: (id: string) => window.alert(`(demo) download ${id}`),
    onDelete: (id: string) =>
      setExisting((e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.filter((f) => f.id !== id)]))),
  };
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live example · edit mode</span>
        <OpenInBuilder schema={FILE_SCHEMA} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <AttachmentsProvider value={api}>
            <FormRenderer schema={FILE_SCHEMA} onSubmit={(v) => { console.log("onSubmit →", v); setValues(v); }} />
          </AttachmentsProvider>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">onSubmit output</p>
          {values ? (
            <pre className="overflow-x-auto text-[12px] font-mono text-foreground">{JSON.stringify(readablePayload(values), null, 2)}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">The two existing files show above (download / delete). Submit — only <strong>newly picked</strong> files land here; existing ones are managed through the provider.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Live preview for the playground — keyed so it remounts on structural edits. */
function LivePreview({ schema }: { schema: FormSchema }) {
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const key = useMemo(() => JSON.stringify(schema.fields.map((f) => [f.id, f.type, f.name])), [schema]);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <FormRenderer key={key} schema={schema} onSubmit={setValues} />
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted payload</p>
        {values ? (
          <pre className="overflow-x-auto text-[12px] font-mono text-foreground">{JSON.stringify(readablePayload(values), null, 2)}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">Submit the preview form to see its payload.</p>
        )}
      </div>
    </div>
  );
}
