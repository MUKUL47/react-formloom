/**
 * Tests for the standalone validator.  Run with:  npm test
 * (uses Node's built-in test runner via tsx — no jest/vitest needed)
 *
 * Grouped from "does the basic mapping work" up to high-intensity cases:
 * deep nested arrays, mixed containers, the `unknownField` policies,
 * augment-via-inject, `enforceRequired` empty semantics, and parity with the
 * renderer's declarative validation.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
// Co-located unit tests for the validator. Run from the repo root:
//   npm run test:validator
import { schemaToZod, UnknownFieldError, type FormLoomSchema } from "./schema-to-zod";

// Small helper: build a schema from a fields array.
const form = (fields: any[]): FormLoomSchema => ({ version: 1, fields });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Baseline: flatten containers, nest arrays, exclude display fields
// ─────────────────────────────────────────────────────────────────────────────
const baseSchema = form([
  { id: "1", name: "name", type: "input", label: "Name", required: true,
    validation: [{ type: "minLength", value: 2, message: "x" }] },
  { id: "2", name: "email", type: "email", label: "Email",
    validation: [{ type: "email", message: "x" }] },
  { id: "3", name: "age", type: "number", label: "Age", props: { min: 18 } },
  { id: "4", name: "sec", type: "section", label: "Sec", children: [
    { id: "4a", name: "city", type: "input", label: "City" },
  ] },
  { id: "5", name: "tabbed", type: "tabs", label: "Tabbed", tabs: [
    { key: "t1", label: "T1", fields: [{ id: "5a", name: "nick", type: "input", label: "Nick" }] },
  ] },
  { id: "6", name: "items", type: "array", label: "Items", children: [
    { id: "6a", name: "sku", type: "input", label: "SKU" },
  ] },
  { id: "7", name: "_h", type: "heading", label: "ignored" },
  { id: "8", name: "score", type: "input", label: "Score", meta: { widget: "rating" } },
]);

const inject = { rating: () => z.number().int().min(0).max(5) };

test("accepts a valid flattened submission", () => {
  const r = schemaToZod(baseSchema, { inject }).safeParse({
    name: "Ada", email: "a@b.com", age: 30, city: "London", nick: "ada", items: [{ sku: "A1" }], score: 4,
  });
  assert.equal(r.success, true, JSON.stringify((r as any).error?.flatten?.().fieldErrors));
});

test("section & tabs children validate as top-level keys; array nests", () => {
  const shape = schemaToZod(baseSchema, { inject }).shape;
  assert.ok("city" in shape, "section child promoted");
  assert.ok("nick" in shape, "tab child promoted");
  assert.ok("items" in shape, "array stays nested under its own name");
  assert.ok(!("sec" in shape), "container name itself is not a key");
});

test("display fields are excluded", () => {
  assert.ok(!("_h" in schemaToZod(baseSchema, { inject }).shape));
});

test("injected widget validator is applied", () => {
  const r = schemaToZod(baseSchema, { inject }).safeParse({ name: "Ada", score: 9 }); // rating max 5
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.flatten().fieldErrors.score);
});

test("strips unknown/stale keys instead of failing", () => {
  const r = schemaToZod(baseSchema, { inject }).safeParse({ name: "Ada", stray: "x" });
  assert.equal(r.success, true);
  if (r.success) assert.ok(!("stray" in r.data));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Deep nested arrays — array → object → array → object → array
// ─────────────────────────────────────────────────────────────────────────────
const deepArray = form([
  { id: "o", name: "orders", type: "array", label: "Orders",
    props: { minRows: 1 },
    children: [
      { id: "on", name: "orderNo", type: "input", label: "Order #", required: true },
      { id: "li", name: "lines", type: "array", label: "Lines",
        children: [
          { id: "sku", name: "sku", type: "input", label: "SKU", required: true,
            validation: [{ type: "pattern", value: "^[A-Z0-9]+$", message: "upper/num only" }] },
          { id: "qty", name: "qty", type: "number", label: "Qty",
            validation: [{ type: "min", value: 1, message: "min 1" }] },
          { id: "tags", name: "tags", type: "array", label: "Tags",
            children: [
              { id: "t", name: "tag", type: "input", label: "Tag", required: true },
            ] },
        ] },
    ] },
]);

test("deep nested arrays: valid 3-level payload passes", () => {
  const r = schemaToZod(deepArray, { enforceRequired: true }).safeParse({
    orders: [
      { orderNo: "PO-1", lines: [
        { sku: "AB12", qty: 3, tags: [{ tag: "urgent" }, { tag: "fragile" }] },
        { sku: "CD34", qty: 1, tags: [] },
      ] },
    ],
  });
  assert.equal(r.success, true, JSON.stringify((r as any).error?.flatten?.()));
});

test("deep nested arrays: violation at the 3rd level is caught", () => {
  const r = schemaToZod(deepArray, { enforceRequired: true }).safeParse({
    orders: [
      { orderNo: "PO-1", lines: [
        { sku: "ab12" /* lowercase → pattern fail */, qty: 0 /* < 1 */, tags: [{ tag: "" /* required */ }] },
      ] },
    ],
  });
  assert.equal(r.success, false);
  if (!r.success) {
    const issuePaths = r.error.issues.map((i) => i.path.join("."));
    assert.ok(issuePaths.includes("orders.0.lines.0.sku"), "level-2 sku pattern");
    assert.ok(issuePaths.includes("orders.0.lines.0.qty"), "level-2 qty min");
    assert.ok(issuePaths.includes("orders.0.lines.0.tags.0.tag"), "level-3 tag required");
  }
});

test("array minRows/maxRows are enforced (renderer parity)", () => {
  const s = schemaToZod(deepArray, { enforceRequired: true });
  const tooFew = s.safeParse({ orders: [] }); // minRows: 1
  assert.equal(tooFew.success, false);
  if (!tooFew.success) assert.ok(tooFew.error.issues.some((i) => i.path.join(".") === "orders"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. unknownField policy: passthrough | strip | error
// ─────────────────────────────────────────────────────────────────────────────
const widgetSchema = form([
  { id: "1", name: "keep", type: "input", label: "Keep" },
  { id: "2", name: "sig", type: "signature" as any, label: "Signature" }, // custom type, no inject
  { id: "3", name: "cal", type: "input", label: "Calendar", meta: { widget: "calendar" } }, // widget, no inject
]);

test("unknownField default (passthrough): unmapped widget accepts anything", () => {
  const r = schemaToZod(widgetSchema).safeParse({ keep: "x", sig: { any: "shape" }, cal: [1, 2, 3] });
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.sig, { any: "shape" }, "value retained");
});

test("unknownField: 'strip' drops the key from output", () => {
  const s = schemaToZod(widgetSchema, { unknownField: "strip" });
  assert.ok(!("sig" in s.shape), "custom type stripped from shape");
  assert.ok(!("cal" in s.shape), "widget stripped from shape");
  const r = s.safeParse({ keep: "x", sig: "whatever", cal: "whatever" });
  assert.equal(r.success, true);
  if (r.success) {
    assert.ok(!("sig" in r.data), "stripped from data");
    assert.ok(!("cal" in r.data));
  }
});

test("unknownField: 'error' throws UnknownFieldError at translation time", () => {
  assert.throws(
    () => schemaToZod(widgetSchema, { unknownField: "error" }),
    (e: unknown) => e instanceof UnknownFieldError && (e.key === "signature" || e.key === "calendar"),
  );
});

test("unknownField: 'error' does NOT throw when every widget is injected", () => {
  assert.doesNotThrow(() =>
    schemaToZod(widgetSchema, {
      unknownField: "error",
      inject: { signature: () => z.string(), calendar: () => z.string() },
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. inject AUGMENTS existing built-in fields (not just widgets)
// ─────────────────────────────────────────────────────────────────────────────
const augmentSchema = form([
  { id: "1", name: "email", type: "email", label: "Email", validation: [{ type: "email", message: "x" }] },
  { id: "2", name: "age", type: "number", label: "Age" },
]);

test("inject augments an existing field via `base`", () => {
  const s = schemaToZod(augmentSchema, {
    inject: {
      email: (_f, base) => (base as z.ZodString).endsWith("@acme.com", "must be an acme address"),
      number: (_f, base) => (base as z.ZodNumber).int().min(18),
    },
  });
  const bad = s.safeParse({ email: "ada@gmail.com", age: 17.5 });
  assert.equal(bad.success, false);
  if (!bad.success) {
    const fe = bad.error.flatten().fieldErrors;
    assert.ok(fe.email, "augmented email rule fired");
    assert.ok(fe.age, "augmented number rule fired");
  }
  assert.equal(s.safeParse({ email: "ada@acme.com", age: 30 }).success, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. enforceRequired — empty semantics match the renderer
// ─────────────────────────────────────────────────────────────────────────────
const requiredSchema = form([
  { id: "1", name: "name", type: "input", label: "Name", required: true },
  { id: "2", name: "tags", type: "multiSelect", label: "Tags", required: true,
    options: [{ label: "A", value: "a" }, { label: "B", value: "b" }] },
  { id: "3", name: "agree", type: "checkbox", label: "Agree", required: true },
  { id: "4", name: "bio", type: "input", label: "Bio", validation: [{ type: "minLength", value: 5, message: "x" }] },
]);

test("enforceRequired: empty string / null / [] all fail a required field", () => {
  const s = schemaToZod(requiredSchema, { enforceRequired: true });
  for (const empty of [undefined, null, ""]) {
    const r = s.safeParse({ name: empty, tags: ["a"], agree: true });
    assert.equal(r.success, false, `name=${JSON.stringify(empty)} should fail`);
  }
  // required multiSelect with [] is empty → fails
  const emptyArr = s.safeParse({ name: "Ada", tags: [], agree: true });
  assert.equal(emptyArr.success, false, "empty required multiSelect fails");
});

test("enforceRequired: a completely ABSENT required key fails (not just empty values)", () => {
  const s = schemaToZod(requiredSchema, { enforceRequired: true });
  const r = s.safeParse({ tags: ["a"], agree: true }); // `name` key omitted entirely
  assert.equal(r.success, false, "absent required key must fail, not pass");
  if (!r.success) assert.ok(r.error.flatten().fieldErrors.name, "error reported on the missing field");
});

test("enforceRequired: required checkbox present as false passes (false is not empty)", () => {
  const s = schemaToZod(requiredSchema, { enforceRequired: true });
  const r = s.safeParse({ name: "Ada", tags: ["a"], agree: false });
  assert.equal(r.success, true, "false is a provided value, not empty");
});

test("non-required field skips its own rules when empty (renderer parity)", () => {
  // `bio` has minLength 5 but is NOT required → empty string must pass, like the renderer.
  const s = schemaToZod(requiredSchema, { enforceRequired: true });
  assert.equal(s.safeParse({ name: "Ada", tags: ["a"], agree: true, bio: "" }).success, true);
  // but a non-empty too-short bio still fails
  assert.equal(s.safeParse({ name: "Ada", tags: ["a"], agree: true, bio: "hi" }).success, false);
});

test("enforceRequired defaults off: required fields are optional", () => {
  const r = schemaToZod(requiredSchema).safeParse({}); // nothing provided
  assert.equal(r.success, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Renderer PARITY — the translator ignores what the renderer ignores
// ─────────────────────────────────────────────────────────────────────────────
test("parity: props.min/max are NOT enforced (only validation rules are)", () => {
  const s = schemaToZod(form([
    { id: "1", name: "qty", type: "number", label: "Qty", props: { min: 1, max: 10 } }, // props only
  ]));
  assert.equal(s.safeParse({ qty: 999 }).success, true, "props bounds are UI-only, not validation");
});

test("parity: select accepts only its listed options; empty options → any string", () => {
  const s = schemaToZod(form([
    { id: "1", name: "plan", type: "select", label: "Plan",
      options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] },
    { id: "2", name: "dyn", type: "select", label: "Dynamic", options: [] }, // async/empty → z.string()
  ]));
  assert.equal(s.safeParse({ plan: "pro", dyn: "anything" }).success, true);
  assert.equal(s.safeParse({ plan: "enterprise", dyn: "x" }).success, false);
});

test("parity: mixed containers flatten, array stays nested, all in one payload", () => {
  const s = schemaToZod(form([
    { id: "c", name: "cols", type: "columns", label: "Cols", children: [
      { id: "c1", name: "first", type: "input", label: "First", required: true },
      { id: "sec", name: "sec", type: "section", label: "Sec", children: [
        { id: "c2", name: "second", type: "input", label: "Second" },
      ] },
    ] },
    { id: "t", name: "tabs", type: "tabs", label: "Tabs", tabs: [
      { key: "a", label: "A", fields: [{ id: "ta", name: "alpha", type: "input", label: "Alpha" }] },
    ] },
    { id: "a", name: "rows", type: "array", label: "Rows", children: [
      { id: "r", name: "r", type: "input", label: "R" },
    ] },
  ]), { enforceRequired: true });
  const shape = s.shape;
  for (const k of ["first", "second", "alpha", "rows"]) assert.ok(k in shape, `${k} present`);
  assert.equal(s.safeParse({ first: "x", second: "y", alpha: "z", rows: [{ r: "1" }] }).success, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Robustness
// ─────────────────────────────────────────────────────────────────────────────
test("rejects a non-FormLoom schema", () => {
  assert.throws(() => schemaToZod({ foo: "bar" } as any));
  assert.throws(() => schemaToZod(null as any));
});

test("dateRange and file map to structural types", () => {
  const s = schemaToZod(form([
    { id: "1", name: "when", type: "dateRange", label: "When" },
    { id: "2", name: "doc", type: "file", label: "Doc" },
  ]));
  assert.equal(s.safeParse({ when: { start: "2026-01-01", end: "2026-01-31" }, doc: "s3://k" }).success, true);
  assert.equal(s.safeParse({ doc: ["s3://a", "s3://b"] }).success, true, "file accepts an array of refs");
  assert.equal(s.safeParse({ when: { start: "01/01/2026" } }).success, false, "non-ISO date rejected");
});
